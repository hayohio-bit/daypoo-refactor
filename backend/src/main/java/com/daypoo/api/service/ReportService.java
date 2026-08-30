package com.daypoo.api.service;

import com.daypoo.api.dto.HealthReportHistoryResponse;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.dto.VisitLogResponse;
import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.entity.enums.ReportType;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.VisitLogRepository;
import com.daypoo.api.service.report.ReportCacheStore;
import com.daypoo.api.service.report.ReportSnapshotStore;
import com.daypoo.api.service.report.ReportStatisticsCalculator;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 컨디션 리포트의 생성 흐름(캐시 → 스냅샷 → 재계산)을 조율한다. */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

  private final PooRecordRepository recordRepository;
  private final VisitLogRepository visitLogRepository;
  private final NotificationService notificationService;
  private final ReportCacheStore cacheStore;
  private final ReportSnapshotStore snapshotStore;
  private final ReportStatisticsCalculator calculator;

  /** 기록이 없어 점수를 산출할 수 없을 때 사용하는 기본 건강 점수 */
  private static final int DEFAULT_HEALTH_SCORE = 50;

  /** 컨디션 리포트 생성 및 조회 */
  public HealthReportResponse generateReport(User user, ReportType type) {
    String cacheKey = cacheStore.buildKey(user, type);

    Optional<PooRecord> lastRecord = recordRepository.findFirstByUserOrderByCreatedAtDesc(user);
    LocalDateTime latestRecordTime =
        lastRecord.map(PooRecord::getCreatedAt).orElse(LocalDateTime.MIN);

    Optional<HealthReportResponse> cached = findUsableCache(cacheKey, type, latestRecordTime, user);
    if (cached.isPresent()) return cached.get();

    Optional<HealthReportResponse> snapshot = findUsableSnapshot(user, type, latestRecordTime);
    if (snapshot.isPresent()) return snapshot.get();

    HealthReportResponse response = buildReport(user, type);
    snapshotStore.save(user, type, response);
    cacheStore.save(cacheKey, response);
    notifyReportReady(user, type);
    return response;
  }

  /** 리포트 히스토리 조회 */
  @Transactional(readOnly = true)
  public List<HealthReportHistoryResponse> getReportHistory(User user) {
    return snapshotStore.findAllByUser(user).stream()
        .map(HealthReportHistoryResponse::from)
        .collect(Collectors.toList());
  }

  /** 컨디션 점수 트렌드 조회 (최근 10건) */
  @Transactional(readOnly = true)
  public List<Integer> getHealthTrend(User user) {
    return snapshotStore.findAllByUser(user).stream()
        .limit(10)
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

  private Optional<HealthReportResponse> findUsableCache(
      String cacheKey, ReportType type, LocalDateTime latestRecordTime, User user) {
    return cacheStore
        .find(cacheKey)
        .filter(
            response -> {
              LocalDateTime analyzedAt;
              try {
                analyzedAt = LocalDateTime.parse(response.analyzedAt());
              } catch (Exception e) {
                // 분석 시각을 읽지 못한 캐시는 신뢰할 수 없으므로 버리고 다시 생성한다.
                log.warn(
                    "Failed to parse analyzedAt from cached report for user {}: {}",
                    user.getId(),
                    e.getMessage());
                return false;
              }
              boolean usable = !shouldRegenerateReport(type, analyzedAt, latestRecordTime);
              if (!usable) {
                log.info(
                    "Force re-generation for user {} [{}] due to outdated cache.",
                    user.getId(),
                    type);
              }
              return usable;
            });
  }

  private Optional<HealthReportResponse> findUsableSnapshot(
      User user, ReportType type, LocalDateTime latestRecordTime) {
    return snapshotStore
        .findTodaySnapshot(user, type)
        // mostFrequentBristol 이 없는 스냅샷은 지표가 추가되기 전의 구버전이라 다시 만든다.
        .filter(s -> s.getMostFrequentBristol() != null)
        .filter(s -> !shouldRegenerateReport(type, s.getCreatedAt(), latestRecordTime))
        .map(snapshotStore::toResponse);
  }

  /** 로컬 통계만으로 리포트를 계산한다. */
  private HealthReportResponse buildReport(User user, ReportType type) {
    LocalDateTime startTime = calculator.getStartTime(type);
    LocalDateTime endTime = LocalDateTime.now();

    List<PooRecord> records =
        recordRepository.findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, startTime);
    if (records.isEmpty()) {
      throw new IllegalStateException("분석할 배변 기록이 없습니다. 먼저 배변 활동을 기록해 주세요.");
    }

    List<Integer> weeklyHealthScores = null;
    String improvementTrend = null;
    Map<Integer, Integer> bristolDistribution = null;
    Double avgDailyRecordCount = null;

    if (type == ReportType.MONTHLY) {
      weeklyHealthScores =
          calculator.toWeeklyHealthScores(calculator.buildWeeklySummaries(records, startTime));
      improvementTrend = calculator.computeImprovementTrend(weeklyHealthScores);
      bristolDistribution = calculator.computeBristolDistribution(records);
      avgDailyRecordCount = calculator.computeAvgDailyRecordCount(records, startTime);
    }

    Integer healthyRatio = calculator.computeHealthyRatio(records);

    return HealthReportResponse.builder()
        .reportType(type.name())
        .healthScore(healthyRatio != null ? healthyRatio : DEFAULT_HEALTH_SCORE)
        .summary(
            String.format(
                "총 %d건의 기록 중 건강한 배변 비율은 %d%%입니다.",
                records.size(), healthyRatio != null ? healthyRatio : 0))
        .solution("규칙적인 식사와 충분한 수분 섭취를 유지해주세요.")
        .premiumSolution(null)
        .insights(List.of())
        .recordCount(records.size())
        .periodStart(startTime)
        .periodEnd(endTime)
        .analyzedAt(LocalDateTime.now().toString())
        .mostFrequentBristol(calculator.computeMostFrequentBristol(records))
        .mostFrequentCondition(calculator.computeMostFrequentConditionTag(records))
        .mostFrequentDiet(calculator.computeMostFrequentDietTag(records))
        .healthyRatio(healthyRatio)
        .weeklyHealthScores(weeklyHealthScores)
        .improvementTrend(improvementTrend)
        .bristolDistribution(bristolDistribution)
        .avgDailyRecordCount(avgDailyRecordCount)
        .build();
  }

  private void notifyReportReady(User user, ReportType type) {
    notificationService.send(
        user,
        NotificationType.HEALTH,
        type.name() + " 배변 패턴 리포트가 도착했습니다!",
        "AI가 분석한 당신의 최신 장 컨디션 체크 결과를 지금 바로 확인해보세요.",
        "/mypage?tab=report");
  }

  /** DAILY 는 새 기록이 생기면, 그 밖의 종류는 날짜가 바뀌면 다시 생성한다. */
  private boolean shouldRegenerateReport(
      ReportType type, LocalDateTime generatedAt, LocalDateTime latestRecordTime) {
    if (type == ReportType.DAILY) {
      return generatedAt.isBefore(latestRecordTime);
    }
    return generatedAt.toLocalDate().isBefore(LocalDateTime.now().toLocalDate());
  }
}
