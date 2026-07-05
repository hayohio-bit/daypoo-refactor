package com.daypoo.api.service;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.PooCheckInResponse;
import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.VisitLog;
import com.daypoo.api.entity.enums.VisitEventType;
import com.daypoo.api.event.PooRecordCreatedEvent;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.mapper.PooRecordMapper;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.VisitCountProjection;
import com.daypoo.api.repository.VisitLogRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PooRecordService {

  private final PooRecordRepository recordRepository;
  private final ToiletRepository toiletRepository;
  private final UserService userService;
  private final LocationVerificationService locationVerificationService;
  private final GeocodingService geocodingService;
  private final ApplicationEventPublisher eventPublisher;
  private final PooRecordMapper recordMapper;
  private final VisitLogRepository visitLogRepository;
  private final AiClient aiClient;
  private final com.daypoo.api.repository.UserRepository userRepository;

  // 보상 설정 (방문 1회당 경험치 5, 포인트 10 / 같은 화장실 하루 3회 상한)
  private static final int REWARD_EXP = 5;
  private static final int REWARD_POINTS = 10;
  private static final int DAILY_POINT_LIMIT_PER_TOILET = 3;

  /** 화장실 도착 체크인 담당 */
  @Transactional
  public PooCheckInResponse checkIn(
      String email, Long toiletId, double lat, double lon, Long enteredAt) {
    User user = userService.getByEmail(email);

    // 위치 검증 (확대된 150m 반경 사용)
    Double distance = locationVerificationService.getDistanceToToilet(toiletId, lat, lon);
    boolean isNear = distance != null && distance <= 150.0;

    if (!isNear) {
      logVisit(
          user,
          toiletId,
          VisitEventType.VERIFICATION_FAILED,
          null,
          null,
          lat,
          lon,
          distance,
          null,
          "OUT_OF_RANGE");
      throw new BusinessException(ErrorCode.OUT_OF_RANGE);
    }

    // 도착 시간 기록 및 반환 (Fast Check-in 로직 대응)
    long arrivalTimeMillis =
        locationVerificationService.getOrSetArrivalTime(user.getId(), toiletId, enteredAt);
    log.info(
        "User {} checked-in at toilet {}. Arrival Time: {}", email, toiletId, arrivalTimeMillis);

    long elapsedSeconds = (System.currentTimeMillis() - arrivalTimeMillis) / 1000;
    long remainedSeconds = Math.max(0, 60 - elapsedSeconds);

    LocalDateTime firstArrivalTime =
        LocalDateTime.ofInstant(Instant.ofEpochMilli(arrivalTimeMillis), ZoneId.systemDefault());

    logVisit(
        user,
        toiletId,
        VisitEventType.CHECK_IN,
        firstArrivalTime,
        null,
        lat,
        lon,
        distance,
        null,
        null);

    return new PooCheckInResponse(toiletId, firstArrivalTime, elapsedSeconds, remainedSeconds);
  }

  /** 배변 기록 생성 및 방문 인증 처리 toiletId 유무에 따라 방문 인증 통합 여부를 결정합니다. */
  @Transactional
  public PooRecordResponse createRecord(String email, PooRecordCreateRequest request) {
    User user = userService.getByEmail(email);
    boolean isVisitAuth = request.toiletId() != null;

    Toilet toilet = null;
    if (isVisitAuth) {
      toilet =
          toiletRepository
              .findById(request.toiletId())
              .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

      // 방문 인증 시에만 위치 및 체류 시간 검증
      if (request.latitude() == null || request.longitude() == null) {
        throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
      }
      validateLocationAndTime(user, toilet, request.latitude(), request.longitude());
    }

    // AI 분석 or 수동 입력값 결정 (실패 시 여기서 예외 발생 → 아래 resetArrivalTime 미호출)
    PoopAttributes attrs = resolvePoopAttributes(request);

    // AI 분석 성공 후, 방문 인증인 경우에만 타이머 리셋
    if (isVisitAuth && toilet != null) {
      locationVerificationService.resetArrivalTime(user.getId(), toilet.getId());
    }

    // 지역명 추출 (화장실 주소 우선, 없을 경우 좌표 기반 역지오코딩)
    String regionName = determineRegion(toilet, request.latitude(), request.longitude());
    user.updateHomeRegion(regionName);
    userRepository.save(user);

    // 기록 저장
    PooRecord saved =
        recordRepository.save(
            PooRecord.builder()
                .user(user)
                .toilet(toilet)
                .bristolScale(attrs.bristolScale())
                .color(attrs.color())
                .conditionTags(String.join(",", attrs.conditionTags()))
                .dietTags(String.join(",", attrs.dietTags()))
                .warningTags(String.join(",", attrs.warningTags()))
                .regionName(regionName)
                .build());

    // 보상 처리 (방문 인증 시에만 포인트 지급 검토)
    processRewards(user, toilet, regionName);

    // Visit Log 기록 (방문 인증 시에만)
    if (isVisitAuth) {
      logVisitOnSuccess(user, toilet, request, saved);
    }

    return recordMapper.toResponse(saved);
  }

  private String determineRegion(Toilet toilet, Double lat, Double lon) {
    if (toilet != null && toilet.getAddress() != null) {
      String region = extractRegionFromAddress(toilet.getAddress());
      if (!"기타".equals(region)) return region;
    }
    if (lat != null && lon != null) {
      return geocodingService.reverseGeocode(lat, lon);
    }
    return "기타";
  }

  private void processRewards(User user, Toilet toilet, String regionName) {
    int rewardPoints = 0;
    if (toilet != null) {
      LocalDateTime todayStart = LocalDate.now().atStartOfDay();
      LocalDateTime todayEnd = todayStart.plusDays(1);
      long todayCount =
          visitLogRepository.countByUserAndToiletAndEventTypeAndCreatedAtBetween(
              user, toilet, VisitEventType.RECORD_CREATED, todayStart, todayEnd);
      rewardPoints = todayCount < DAILY_POINT_LIMIT_PER_TOILET ? REWARD_POINTS : 0;
    }

    eventPublisher.publishEvent(
        new PooRecordCreatedEvent(user.getEmail(), regionName, REWARD_EXP, rewardPoints));
  }

  private void logVisitOnSuccess(
      User user, Toilet toilet, PooRecordCreateRequest request, PooRecord saved) {
    long arrivalTimeMillis =
        locationVerificationService.getOrSetArrivalTime(user.getId(), toilet.getId(), null);
    LocalDateTime arrivalAt =
        LocalDateTime.ofInstant(Instant.ofEpochMilli(arrivalTimeMillis), ZoneId.systemDefault());

    logVisit(
        user,
        toilet.getId(),
        VisitEventType.RECORD_CREATED,
        arrivalAt,
        LocalDateTime.now(),
        request.latitude(),
        request.longitude(),
        null,
        saved,
        null);
  }

  private void validateLocationAndTime(User user, Toilet toilet, double lat, double lon) {
    // 시뮬레이션 봇은 위치 및 체류 시간 검증 생략
    if (user.getEmail() != null && user.getEmail().startsWith("bot_")) {
      log.info(
          "Bot account detected ({}), skipping location and time validation.", user.getEmail());
      return;
    }

    Double distance = locationVerificationService.getDistanceToToilet(toilet.getId(), lat, lon);
    if (distance == null || distance > 150.0) {
      logVisit(
          user,
          toilet.getId(),
          VisitEventType.VERIFICATION_FAILED,
          null,
          null,
          lat,
          lon,
          distance,
          null,
          "OUT_OF_RANGE");
      throw new BusinessException(ErrorCode.OUT_OF_RANGE);
    }
    if (!locationVerificationService.hasStayedLongEnough(user.getId(), toilet.getId())) {
      logVisit(
          user,
          toilet.getId(),
          VisitEventType.VERIFICATION_FAILED,
          null,
          null,
          lat,
          lon,
          distance,
          null,
          "STAY_TIME_NOT_MET");
      throw new BusinessException(ErrorCode.STAY_TIME_NOT_MET);
    }
  }

  private void logVisit(
      User user,
      Long toiletId,
      VisitEventType eventType,
      LocalDateTime arrivalAt,
      LocalDateTime completedAt,
      double lat,
      double lon,
      Double distance,
      PooRecord record,
      String failureReason) {
    try {
      Toilet toilet = toiletRepository.findById(toiletId).orElse(null);
      if (toilet == null) return;

      VisitLog visitLog =
          VisitLog.builder()
              .user(user)
              .toilet(toilet)
              .eventType(eventType)
              .arrivalAt(arrivalAt)
              .completedAt(completedAt)
              .userLatitude(lat)
              .userLongitude(lon)
              .distanceMeters(distance)
              .pooRecord(record)
              .failureReason(failureReason)
              .dwellSeconds(
                  arrivalAt != null && completedAt != null
                      ? (int) java.time.Duration.between(arrivalAt, completedAt).toSeconds()
                      : null)
              .build();

      visitLogRepository.save(visitLog);
    } catch (DataAccessException e) {
      log.error("Failed to log visit: {}", e.getMessage());
    }
  }

  private PoopAttributes resolvePoopAttributes(PooRecordCreateRequest request) {
    boolean hasImage = request.imageBase64() != null && !request.imageBase64().isEmpty();

    if (hasImage) {
      AiAnalysisResponse ai = aiClient.analyzePoopImage(request.imageBase64());
      if (Boolean.FALSE.equals(ai.isPoop())) {
        throw new BusinessException(ErrorCode.NOT_POOP_IMAGE);
      }
      List<String> warnings = ai.warningTags() != null ? ai.warningTags() : Collections.emptyList();
      log.info(
          "AI Analysis: Bristol {}, Color {}, Warnings: {}",
          ai.bristolScale(),
          ai.color(),
          warnings);
      return new PoopAttributes(
          ai.bristolScale(),
          ai.color(),
          Collections.emptyList(),
          Collections.emptyList(),
          warnings);
    }

    Integer bristolScale = request.bristolScale();
    String color = request.color();
    List<String> conditionTags =
        request.conditionTags() != null ? request.conditionTags() : Collections.emptyList();
    List<String> dietTags =
        request.dietTags() != null ? request.dietTags() : Collections.emptyList();

    if (bristolScale == null || color == null || color.isEmpty()) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
    if (conditionTags.isEmpty() || dietTags.isEmpty()) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
    return new PoopAttributes(
        bristolScale, color, conditionTags, dietTags, Collections.emptyList());
  }

  private record PoopAttributes(
      Integer bristolScale,
      String color,
      List<String> conditionTags,
      List<String> dietTags,
      List<String> warningTags) {}

  /** AI 이미지 분석만 수행 (기록 저장 안 함) 프론트엔드 분석 미리보기 UX 지원용 */
  @Transactional(readOnly = true)
  public AiAnalysisResponse analyzeImageOnly(String imageBase64) {
    if (imageBase64 == null || imageBase64.isEmpty()) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
    log.info("Performing AI analysis only (no record creation)");
    return aiClient.analyzePoopImage(imageBase64);
  }

  @Transactional(readOnly = true)
  public Page<PooRecordResponse> getMyRecords(String email, Pageable pageable) {
    User user = userService.getByEmail(email);

    return recordRepository
        .findByUserOrderByCreatedAtDesc(user, pageable)
        .map(recordMapper::toResponse);
  }

  @Transactional(readOnly = true)
  public Map<Long, Long> getMyVisitCounts(String email) {
    User user = userService.getByEmail(email);
    List<VisitCountProjection> rows = recordRepository.findVisitCountsByUser(user);
    Map<Long, Long> result = new HashMap<>();
    for (VisitCountProjection row : rows) {
      if (row != null && row.getToiletId() != null) {
        result.put(row.getToiletId(), row.getVisitCount());
      }
    }
    return result;
  }

  @Transactional(readOnly = true)
  public PooRecordResponse getRecord(String email, Long recordId) {
    PooRecord record =
        recordRepository
            .findById(recordId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

    if (!record.getUser().getEmail().equals(email)) {
      throw new BusinessException(ErrorCode.HANDLE_ACCESS_DENIED);
    }

    return recordMapper.toResponse(record);
  }

  /** 주소 문자열에서 구/군/시 단위 지역명을 추출합니다. */
  private String extractRegionFromAddress(String address) {
    if (address == null || address.isBlank()) {
      return "기타";
    }
    String[] parts = address.split("\\s+");
    for (int i = 1; i < parts.length; i++) {
      String part = parts[i];
      if (part.endsWith("구") || part.endsWith("군")) {
        return part;
      }
      if (part.endsWith("시") && i >= 1) {
        if (i + 1 < parts.length && parts[i + 1].endsWith("구")) {
          return parts[i + 1];
        }
        return part;
      }
    }
    return "기타";
  }
}
