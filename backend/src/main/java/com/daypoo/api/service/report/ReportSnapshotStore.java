package com.daypoo.api.service.report;

import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ReportType;
import com.daypoo.api.repository.HealthReportSnapshotRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** 리포트 스냅샷의 저장과 조회, 그리고 응답 DTO 와의 변환을 담당한다. */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReportSnapshotStore {

  private final HealthReportSnapshotRepository snapshotRepository;
  private final ObjectMapper objectMapper;

  /** 오늘 생성된 같은 종류의 스냅샷 중 가장 최근 것 */
  public Optional<HealthReportSnapshot> findTodaySnapshot(User user, ReportType type) {
    LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
    return snapshotRepository.findFirstByUserAndReportTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
        user, type, todayStart, todayStart.plusDays(1));
  }

  public List<HealthReportSnapshot> findAllByUser(User user) {
    return snapshotRepository.findByUserOrderByCreatedAtDesc(user);
  }

  /** 스냅샷 엔티티를 응답 DTO 로 되돌린다. */
  public HealthReportResponse toResponse(HealthReportSnapshot s) {
    return HealthReportResponse.builder()
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
        .weeklyHealthScores(parseWeeklyScores(s.getWeeklyHealthScores()))
        .improvementTrend(s.getImprovementTrend())
        .bristolDistribution(parseBristolDistribution(s.getBristolDistribution()))
        .avgDailyRecordCount(s.getAvgDailyRecordCount())
        .build();
  }

  /** 생성된 리포트를 스냅샷으로 영구 저장한다. 저장 실패는 리포트 응답을 막지 않는다. */
  public void save(User user, ReportType type, HealthReportResponse response) {
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

  private List<Integer> parseWeeklyScores(String raw) {
    if (raw == null || raw.isBlank()) return null;
    return Arrays.stream(raw.split(",")).map(Integer::parseInt).collect(Collectors.toList());
  }

  private Map<Integer, Integer> parseBristolDistribution(String raw) {
    if (raw == null) return null;
    try {
      return objectMapper.readValue(raw, new TypeReference<Map<Integer, Integer>>() {});
    } catch (Exception e) {
      log.warn("Failed to parse bristol distribution from snapshot", e);
      return null;
    }
  }
}
