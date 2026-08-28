package com.daypoo.api.service.report;

import com.daypoo.api.dto.WeeklySummaryData;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.enums.ReportType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Component;

/** 배변 기록에서 리포트 지표를 계산한다. 상태를 갖지 않는 순수 계산 전용 컴포넌트다. */
@Component
public class ReportStatisticsCalculator {

  /** 건강한 배변으로 판정하는 브리스톨 척도 범위 */
  private static final int HEALTHY_BRISTOL_MIN = 3;

  private static final int HEALTHY_BRISTOL_MAX = 4;

  /** 주차별 점수 비교에서 추세 변화로 인정하는 최소 점수 차 */
  private static final int TREND_THRESHOLD = 5;

  /** 점수를 산출할 수 없는 주차에 사용하는 기본 점수 */
  private static final int DEFAULT_WEEK_SCORE = 50;

  /** 리포트 종류별 집계 시작 시각 */
  public LocalDateTime getStartTime(ReportType type) {
    return switch (type) {
      case DAILY -> LocalDate.now().atStartOfDay();
      case WEEKLY -> LocalDateTime.now().minusWeeks(1);
      case MONTHLY -> LocalDateTime.now().minusWeeks(4);
    };
  }

  /** 건강한 배변 비율(%). 기록이 없으면 null 을 반환한다. */
  public Integer computeHealthyRatio(List<PooRecord> records) {
    if (records == null || records.isEmpty()) return null;
    long healthyCount = records.stream().filter(this::isHealthy).count();
    return (int) (healthyCount * 100 / records.size());
  }

  /** 최근 4주를 주 단위로 나눈 요약 */
  public List<WeeklySummaryData> buildWeeklySummaries(
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

      int healthyRatio = computeHealthyRatio(weekRecords);

      String topDiet = computeTopTags(splitTags(weekRecords, PooRecord::getDietTags), 3);
      String topCondition = computeTopTags(splitTags(weekRecords, PooRecord::getConditionTags), 3);

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

  /** 주차별 요약을 주차별 건강 점수로 환산한다. */
  public List<Integer> toWeeklyHealthScores(List<WeeklySummaryData> summaries) {
    return summaries.stream()
        .map(s -> s.recordCount() == 0 ? 0 : DEFAULT_WEEK_SCORE + s.healthyRatio() / 2)
        .collect(Collectors.toList());
  }

  /** 앞 2주 평균과 뒤 2주 평균을 비교해 개선 추세를 판정한다. */
  public String computeImprovementTrend(List<Integer> scores) {
    if (scores == null || scores.size() < 4) return "STABLE";
    double firstHalf = (getScore(scores, 0) + getScore(scores, 1)) / 2.0;
    double secondHalf = (getScore(scores, 2) + getScore(scores, 3)) / 2.0;

    if (secondHalf - firstHalf > TREND_THRESHOLD) return "IMPROVING";
    if (firstHalf - secondHalf > TREND_THRESHOLD) return "DECLINING";
    return "STABLE";
  }

  /** 브리스톨 척도별 기록 수 */
  public Map<Integer, Integer> computeBristolDistribution(List<PooRecord> records) {
    return records.stream()
        .map(PooRecord::getBristolScale)
        .filter(Objects::nonNull)
        .collect(
            Collectors.groupingBy(
                scale -> scale,
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
  }

  /** 집계 기간의 하루 평균 기록 수 */
  public Double computeAvgDailyRecordCount(List<PooRecord> records, LocalDateTime startTime) {
    long days = ChronoUnit.DAYS.between(startTime, LocalDateTime.now());
    if (days <= 0) days = 1;
    double avg = (double) records.size() / days;
    return Math.round(avg * 10) / 10.0;
  }

  /** 가장 자주 등장한 브리스톨 척도 */
  public Integer computeMostFrequentBristol(List<PooRecord> records) {
    return computeMostFrequent(
        records.stream()
            .map(PooRecord::getBristolScale)
            .filter(Objects::nonNull)
            .collect(Collectors.toList()));
  }

  /** 가장 자주 등장한 컨디션 태그 */
  public String computeMostFrequentConditionTag(List<PooRecord> records) {
    return computeMostFrequentTag(splitTags(records, PooRecord::getConditionTags));
  }

  /** 가장 자주 등장한 식단 태그 */
  public String computeMostFrequentDietTag(List<PooRecord> records) {
    return computeMostFrequentTag(splitTags(records, PooRecord::getDietTags));
  }

  /** 빈도 상위 limit 개의 태그를 쉼표로 이어 반환한다. */
  public String computeTopTags(List<String> tags, int limit) {
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

  private boolean isHealthy(PooRecord record) {
    Integer scale = record.getBristolScale();
    return scale != null && scale >= HEALTHY_BRISTOL_MIN && scale <= HEALTHY_BRISTOL_MAX;
  }

  private List<String> splitTags(List<PooRecord> records, Function<PooRecord, String> tagField) {
    return records.stream()
        .flatMap(
            r -> {
              String tags = tagField.apply(r);
              return tags != null ? Arrays.stream(tags.split(",")) : Stream.empty();
            })
        .collect(Collectors.toList());
  }

  private int getScore(List<Integer> scores, int index) {
    Integer s = scores.get(index);
    return s != null ? s : DEFAULT_WEEK_SCORE;
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
}
