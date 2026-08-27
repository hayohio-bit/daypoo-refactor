package com.daypoo.api.service;

import com.daypoo.api.dto.HealthReportHistoryResponse;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.dto.VisitLogResponse;
import com.daypoo.api.dto.WeeklySummaryData;
import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.entity.enums.ReportType;
import com.daypoo.api.repository.HealthReportSnapshotRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.VisitLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

  private final PooRecordRepository recordRepository;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;
  private final NotificationService notificationService;
  private final HealthReportSnapshotRepository snapshotRepository;
  private final VisitLogRepository visitLogRepository;

  private static final String REPORT_CACHE_KEY_PREFIX = "daypoo:reports:v19:";

  /** AI 컨디션 리포트 생성 및 조회 */
  public HealthReportResponse generateReport(User user, ReportType type) {
    String cacheKey =
        REPORT_CACHE_KEY_PREFIX
            + type.name()
            + ":"
            + user.getId()
            + ":"
            + LocalDateTime.now().toLocalDate();

    // 0. 최신 기록 시간 확인
    Optional<PooRecord> lastRecord = recordRepository.findFirstByUserOrderByCreatedAtDesc(user);
    LocalDateTime latestRecordTime =
        lastRecord.map(PooRecord::getCreatedAt).orElse(LocalDateTime.MIN);
    log.info(
        "Checking DAILY report for user {}. Latest record at: {}", user.getId(), latestRecordTime);

    // 1. 캐시 확인 (새 기록이 없는 경우에만 사용)
    String cachedReport = redisTemplate.opsForValue().get(cacheKey);
    if (cachedReport != null) {
      try {
        HealthReportResponse response =
            objectMapper.readValue(cachedReport, HealthReportResponse.class);
        LocalDateTime analyzedAt = LocalDateTime.parse(response.analyzedAt());

        if (!shouldRegenerateReport(type, analyzedAt, latestRecordTime)) {
          log.info("Returning cached {} report for user {}.", type, user.getId());
          return response;
        }
        log.info("Force re-generation for user {} [{}] due to outdated cache.", user.getId(), type);
      } catch (Exception e) {
        log.warn(
            "Failed to parse cached report or date for user {}: {}", user.getId(), e.getMessage());
      }
    }

    // 2. DB 스냅샷 확인
    LocalDateTime startTime = getStartTime(type);
    LocalDateTime endTime = LocalDateTime.now();
    LocalDateTime todayStart = endTime.toLocalDate().atStartOfDay();
    LocalDateTime tomorrowStart = todayStart.plusDays(1);

    var snapshot =
        snapshotRepository.findFirstByUserAndReportTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            user, type, todayStart, tomorrowStart);

    if (snapshot.isPresent()) {
      HealthReportSnapshot s = snapshot.get();

      if (shouldRegenerateReport(type, s.getCreatedAt(), latestRecordTime)) {
        log.info(
            "Snapshot for {} is outdated or legacy, forcing re-generation for user {}",
            type,
            user.getId());
      } else if (s.getMostFrequentBristol() != null) {
        log.info("Returning DB snapshot {} report for user {}", type, user.getId());

        List<Integer> weeklyScores = null;
        if (s.getWeeklyHealthScores() != null && !s.getWeeklyHealthScores().isBlank()) {
          weeklyScores =
              Arrays.stream(s.getWeeklyHealthScores().split(","))
                  .map(Integer::parseInt)
                  .collect(Collectors.toList());
        }

        Map<Integer, Integer> bristolDist = null;
        if (s.getBristolDistribution() != null) {
          try {
            bristolDist =
                objectMapper.readValue(
                    s.getBristolDistribution(),
                    new com.fasterxml.jackson.core.type.TypeReference<Map<Integer, Integer>>() {});
          } catch (JsonProcessingException e) {
            log.warn("Failed to parse bristol distribution from snapshot", e);
          }
        }

        HealthReportResponse snapshotResponse =
            HealthReportResponse.builder()
                .reportType(s.getReportType().name())
                .healthScore(s.getHealthScore())
                .summary(s.getSummary())
                .solution(s.getSolution())
                .premiumSolution(s.getPremiumSolution())
                .insights(s.getInsights() != null ? List.of(s.getInsights().split(",")) : List.of())
                .recordCount(s.getRecordCount())
                .periodStart(s.getPeriodStart())
                .periodEnd(s.getPeriodEnd())
                .analyzedAt(s.getCreatedAt().toString())
                .mostFrequentBristol(s.getMostFrequentBristol())
                .mostFrequentCondition(s.getMostFrequentCondition())
                .mostFrequentDiet(s.getMostFrequentDiet())
                .healthyRatio(s.getHealthyRatio())
                .weeklyHealthScores(weeklyScores)
                .improvementTrend(s.getImprovementTrend())
                .bristolDistribution(bristolDist)
                .avgDailyRecordCount(s.getAvgDailyRecordCount())
                .build();

        return snapshotResponse;
      } else {
        log.info(
            "Old snapshot found for user {}, forcing re-generation to include new metrics",
            user.getId());
      }
    }

    // 3. 기록 조회
    List<PooRecord> records =
        recordRepository.findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, startTime);

    if (records.isEmpty()) {
      throw new IllegalStateException("분석할 배변 기록이 없습니다. 먼저 배변 활동을 기록해 주세요.");
    }

    // 4. 로컬 통계 기반 리포트 생성 (AI 제거됨)
    log.info("로컬 통계 기반 리포트 생성 for user {} [{}]", user.getId(), type);
    List<Integer> weeklyHealthScores = null;
    String improvementTrend = null;
    Map<Integer, Integer> bristolDistribution = null;
    Double avgDailyRecordCount = null;

    if (type == ReportType.MONTHLY) {
      List<WeeklySummaryData> weeklySummaries = buildWeeklySummaries(records, startTime);
      weeklyHealthScores =
          weeklySummaries.stream()
              .map(s -> s.recordCount() == 0 ? 0 : 50 + s.healthyRatio() / 2)
              .collect(Collectors.toList());
      improvementTrend = computeImprovementTrend(weeklyHealthScores);
      bristolDistribution = computeBristolDistribution(records);
      avgDailyRecordCount = computeAvgDailyRecordCount(records, startTime);
    }

    // 7. 통계 계산 (공통)
    Integer mostFrequentBristol =
        computeMostFrequent(
            records.stream()
                .map(PooRecord::getBristolScale)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));
    String mostFrequentCondition =
        computeMostFrequentTag(
            records.stream()
                .flatMap(
                    r ->
                        r.getConditionTags() != null
                            ? Arrays.stream(r.getConditionTags().split(","))
                            : Stream.empty())
                .collect(Collectors.toList()));
    String mostFrequentDiet =
        computeMostFrequentTag(
            records.stream()
                .flatMap(
                    r ->
                        r.getDietTags() != null
                            ? Arrays.stream(r.getDietTags().split(","))
                            : Stream.empty())
                .collect(Collectors.toList()));
    long healthyCount =
        records.stream()
            .filter(
                r ->
                    r.getBristolScale() != null
                        && r.getBristolScale() >= 3
                        && r.getBristolScale() <= 4)
            .count();
    Integer healthyRatio = records.isEmpty() ? null : (int) (healthyCount * 100 / records.size());

    // 로컬 통계 기반 건강 점수 계산
    int healthScore = healthyRatio != null ? healthyRatio : 50;
    String summary =
        String.format(
            "총 %d건의 기록 중 건강한 배변 비율은 %d%%입니다.",
            records.size(), healthyRatio != null ? healthyRatio : 0);
    String solution = "규칙적인 식사와 충분한 수분 섭취를 유지해주세요.";

    // 8. 최종 리포트 구성
    HealthReportResponse response =
        HealthReportResponse.builder()
            .reportType(type.name())
            .healthScore(healthScore)
            .summary(summary)
            .solution(solution)
            .premiumSolution(null)
            .insights(List.of())
            .recordCount(records.size())
            .periodStart(startTime)
            .periodEnd(endTime)
            .analyzedAt(LocalDateTime.now().toString())
            .mostFrequentBristol(mostFrequentBristol)
            .mostFrequentCondition(mostFrequentCondition)
            .mostFrequentDiet(mostFrequentDiet)
            .healthyRatio(healthyRatio)
            // MONTHLY 필드
            .weeklyHealthScores(weeklyHealthScores)
            .improvementTrend(improvementTrend)
            .bristolDistribution(bristolDistribution)
            .avgDailyRecordCount(avgDailyRecordCount)
            .build();

    // 7. DB 영구 저장 (Snapshot)
    saveSnapshot(user, type, response);

    // 8. 결과 캐싱 (24시간 유지)
    try {
      String serialized = objectMapper.writeValueAsString(response);
      if (serialized != null) {
        redisTemplate.opsForValue().set(cacheKey, serialized, 24, TimeUnit.HOURS);
      }
    } catch (JsonProcessingException e) {
      log.warn("Failed to cache report", e);
    }

    // 9. 알림 전송
    notificationService.send(
        user,
        NotificationType.HEALTH,
        type.name() + " 배변 패턴 리포트가 도착했습니다!",
        "AI가 분석한 당신의 최신 장 컨디션 체크 결과를 지금 바로 확인해보세요.",
        "/mypage?tab=report");

    return response;
  }

  /** 리포트 히스토리 조회 */
  @Transactional(readOnly = true)
  public List<HealthReportHistoryResponse> getReportHistory(User user) {
    return snapshotRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .map(HealthReportHistoryResponse::from)
        .collect(Collectors.toList());
  }

  /** 컨디션 점수 트렌드 조회 */
  @Transactional(readOnly = true)
  public List<Integer> getHealthTrend(User user) {
    return snapshotRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .limit(10) // 최근 10개
        .map(HealthReportSnapshot::getHealthScore)
        .collect(Collectors.toList());
  }

  /** 방문 패턴 데이터 조회 */
  @Transactional(readOnly = true)
  public List<VisitLogResponse> getVisitPatterns(User user) {
    return visitLogRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .map(VisitLogResponse::from)
        .collect(Collectors.toList());
  }

  private void saveSnapshot(User user, ReportType type, HealthReportResponse response) {
    try {
      String weeklyScoresStr =
          response.weeklyHealthScores() != null
              ? response.weeklyHealthScores().stream()
                  .map(v -> v == null ? "0" : String.valueOf(v))
                  .collect(Collectors.joining(","))
              : null;

      String bristolDistJson = null;
      if (response.bristolDistribution() != null) {
        bristolDistJson = objectMapper.writeValueAsString(response.bristolDistribution());
      }

      snapshotRepository.save(
          HealthReportSnapshot.builder()
              .user(user)
              .reportType(type)
              .healthScore(response.healthScore())
              .summary(response.summary())
              .solution(response.solution())
              .premiumSolution(response.premiumSolution())
              .insights(response.insights() != null ? String.join(",", response.insights()) : null)
              .recordCount(response.recordCount())
              .periodStart(response.periodStart())
              .periodEnd(response.periodEnd())
              .mostFrequentBristol(response.mostFrequentBristol())
              .mostFrequentCondition(response.mostFrequentCondition())
              .mostFrequentDiet(response.mostFrequentDiet())
              .healthyRatio(response.healthyRatio())
              .weeklyHealthScores(weeklyScoresStr)
              .improvementTrend(response.improvementTrend())
              .bristolDistribution(bristolDistJson)
              .avgDailyRecordCount(response.avgDailyRecordCount())
              .build());
    } catch (Exception e) {
      log.error("Failed to save report snapshot: {}", e.getMessage());
    }
  }

  private LocalDateTime getStartTime(ReportType type) {
    return switch (type) {
      case DAILY -> java.time.LocalDate.now().atStartOfDay();
      case WEEKLY -> LocalDateTime.now().minusWeeks(1);
      case MONTHLY -> LocalDateTime.now().minusWeeks(4);
    };
  }

  private List<WeeklySummaryData> buildWeeklySummaries(
      List<PooRecord> records, LocalDateTime startTime) {
    List<WeeklySummaryData> summaries = new ArrayList<>();
    for (int week = 0; week < 4; week++) {
      LocalDateTime weekStart = startTime.plusWeeks(week);
      LocalDateTime weekEnd =
          (week == 3) ? LocalDateTime.now().plusMinutes(1) : startTime.plusWeeks(week + 1);
      List<PooRecord> weekRecords =
          records.stream()
              .filter(
                  r -> !r.getCreatedAt().isBefore(weekStart) && r.getCreatedAt().isBefore(weekEnd))
              .collect(Collectors.toList());

      if (weekRecords.isEmpty()) {
        summaries.add(new WeeklySummaryData(week + 1, 0, 0.0, 0, "", ""));
        continue;
      }

      double avgBristol =
          weekRecords.stream()
              .filter(r -> r.getBristolScale() != null)
              .mapToInt(PooRecord::getBristolScale)
              .average()
              .orElse(0.0);

      long healthyCount =
          weekRecords.stream()
              .filter(
                  r ->
                      r.getBristolScale() != null
                          && r.getBristolScale() >= 3
                          && r.getBristolScale() <= 4)
              .count();
      int healthyRatio = (int) (healthyCount * 100 / weekRecords.size());

      String topDiet =
          computeTopTags(
              weekRecords.stream()
                  .flatMap(
                      r ->
                          r.getDietTags() != null
                              ? Arrays.stream(r.getDietTags().split(","))
                              : Stream.empty())
                  .collect(Collectors.toList()),
              3);
      String topCondition =
          computeTopTags(
              weekRecords.stream()
                  .flatMap(
                      r ->
                          r.getConditionTags() != null
                              ? Arrays.stream(r.getConditionTags().split(","))
                              : Stream.empty())
                  .collect(Collectors.toList()),
              3);

      summaries.add(
          new WeeklySummaryData(
              week + 1,
              weekRecords.size(),
              Math.round(avgBristol * 10) / 10.0,
              healthyRatio,
              topDiet,
              topCondition));
    }
    return summaries;
  }

  private String computeImprovementTrend(List<Integer> scores) {
    if (scores == null || scores.size() < 4) return "STABLE";
    // 앞 2주 평균 vs 뒤 2주 평균
    double firstHalf = (getScore(scores, 0) + getScore(scores, 1)) / 2.0;
    double secondHalf = (getScore(scores, 2) + getScore(scores, 3)) / 2.0;

    if (secondHalf - firstHalf > 5) return "IMPROVING";
    if (firstHalf - secondHalf > 5) return "DECLINING";
    return "STABLE";
  }

  private int getScore(List<Integer> scores, int index) {
    Integer s = scores.get(index);
    return s != null ? s : 50; // default for empty weeks
  }

  private Map<Integer, Integer> computeBristolDistribution(List<PooRecord> records) {
    return records.stream()
        .map(PooRecord::getBristolScale)
        .filter(Objects::nonNull)
        .collect(
            Collectors.groupingBy(
                scale -> scale,
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
  }

  private Double computeAvgDailyRecordCount(List<PooRecord> records, LocalDateTime startTime) {
    long days = ChronoUnit.DAYS.between(startTime, LocalDateTime.now());
    if (days <= 0) days = 1;
    double avg = (double) records.size() / days;
    return Math.round(avg * 10) / 10.0;
  }

  private String computeTopTags(List<String> tags, int limit) {
    if (tags == null || tags.isEmpty()) return "";
    return tags.stream()
        .filter(Objects::nonNull)
        .filter(s -> !s.isBlank())
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet()
        .stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(limit)
        .map(Map.Entry::getKey)
        .collect(Collectors.joining(","));
  }

  private <T> T computeMostFrequent(List<T> items) {
    if (items == null || items.isEmpty()) return null;
    return items.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
        .entrySet()
        .stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey)
        .orElse(null);
  }

  private String computeMostFrequentTag(List<String> tags) {
    Object frequent = computeMostFrequent(tags);
    return frequent != null ? frequent.toString() : null;
  }

  private boolean shouldRegenerateReport(
      ReportType type, LocalDateTime generatedAt, LocalDateTime latestRecordTime) {
    if (type == ReportType.DAILY) {
      return generatedAt.isBefore(latestRecordTime);
    }
    return generatedAt.toLocalDate().isBefore(LocalDateTime.now().toLocalDate());
  }
}
