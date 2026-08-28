package com.daypoo.api.service.report;

import static org.assertj.core.api.Assertions.assertThat;

import com.daypoo.api.dto.WeeklySummaryData;
import com.daypoo.api.entity.PooRecord;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

@DisplayName("리포트 통계 계산기 단위 테스트")
class ReportStatisticsCalculatorTest {

  private final ReportStatisticsCalculator calculator = new ReportStatisticsCalculator();

  private PooRecord record(int bristolScale, LocalDateTime createdAt) {
    return record(bristolScale, createdAt, null, null);
  }

  private PooRecord record(
      int bristolScale, LocalDateTime createdAt, String conditionTags, String dietTags) {
    PooRecord record =
        PooRecord.builder()
            .bristolScale(bristolScale)
            .color("brown")
            .conditionTags(conditionTags)
            .dietTags(dietTags)
            .build();
    ReflectionTestUtils.setField(record, "createdAt", createdAt);
    return record;
  }

  @Test
  @DisplayName("건강한 배변 비율은 브리스톨 3~4 인 기록만 센다")
  void 건강한_배변_비율은_브리스톨_3에서_4만_센다() {
    LocalDateTime now = LocalDateTime.now();
    List<PooRecord> records =
        List.of(record(3, now), record(4, now), record(1, now), record(7, now));

    assertThat(calculator.computeHealthyRatio(records)).isEqualTo(50);
  }

  @Test
  @DisplayName("기록이 없으면 건강한 배변 비율은 null 이다")
  void 기록이_없으면_비율은_null_이다() {
    assertThat(calculator.computeHealthyRatio(List.of())).isNull();
  }

  @Test
  @DisplayName("브리스톨 척도 분포는 척도별 기록 수를 센다")
  void 브리스톨_분포는_척도별_기록_수를_센다() {
    LocalDateTime now = LocalDateTime.now();
    List<PooRecord> records = List.of(record(3, now), record(3, now), record(5, now));

    Map<Integer, Integer> distribution = calculator.computeBristolDistribution(records);

    assertThat(distribution).containsExactlyInAnyOrderEntriesOf(Map.of(3, 2, 5, 1));
  }

  @Test
  @DisplayName("가장 자주 등장한 브리스톨 척도를 찾는다")
  void 최빈_브리스톨_척도를_찾는다() {
    LocalDateTime now = LocalDateTime.now();
    List<PooRecord> records = List.of(record(4, now), record(4, now), record(2, now));

    assertThat(calculator.computeMostFrequentBristol(records)).isEqualTo(4);
  }

  @Test
  @DisplayName("쉼표로 이어진 태그를 분해해 최빈 태그를 찾는다")
  void 최빈_태그를_찾는다() {
    LocalDateTime now = LocalDateTime.now();
    List<PooRecord> records =
        List.of(record(3, now, "스트레스,피로", "매운음식"), record(4, now, "스트레스", "채소"));

    assertThat(calculator.computeMostFrequentConditionTag(records)).isEqualTo("스트레스");
  }

  @Test
  @DisplayName("빈도 상위 태그만 지정한 개수만큼 이어 붙인다")
  void 상위_태그를_지정한_개수만큼_반환한다() {
    List<String> tags = List.of("a", "a", "a", "b", "b", "c", " ");

    assertThat(calculator.computeTopTags(tags, 2)).isEqualTo("a,b");
  }

  @Test
  @DisplayName("태그가 비어 있으면 빈 문자열을 반환한다")
  void 태그가_비면_빈_문자열을_반환한다() {
    assertThat(calculator.computeTopTags(List.of(), 3)).isEmpty();
  }

  @Test
  @DisplayName("뒤 2주 평균이 앞 2주보다 5점 넘게 높으면 개선으로 판정한다")
  void 뒤_2주가_높으면_개선이다() {
    assertThat(calculator.computeImprovementTrend(List.of(50, 50, 60, 62))).isEqualTo("IMPROVING");
  }

  @Test
  @DisplayName("뒤 2주 평균이 앞 2주보다 5점 넘게 낮으면 악화로 판정한다")
  void 뒤_2주가_낮으면_악화다() {
    assertThat(calculator.computeImprovementTrend(List.of(70, 70, 50, 50))).isEqualTo("DECLINING");
  }

  @Test
  @DisplayName("점수 차가 5점 이하이거나 주차가 4개 미만이면 유지로 판정한다")
  void 변화가_작으면_유지다() {
    assertThat(calculator.computeImprovementTrend(List.of(50, 50, 52, 54))).isEqualTo("STABLE");
    assertThat(calculator.computeImprovementTrend(List.of(50, 90))).isEqualTo("STABLE");
    assertThat(calculator.computeImprovementTrend(null)).isEqualTo("STABLE");
  }

  @Test
  @DisplayName("기록이 없는 주차의 건강 점수는 0 이다")
  void 기록이_없는_주차의_점수는_0이다() {
    List<WeeklySummaryData> summaries =
        List.of(
            new WeeklySummaryData(1, 0, 0.0, 0, "", ""),
            new WeeklySummaryData(2, 4, 3.5, 100, "채소", "쾌적"));

    assertThat(calculator.toWeeklyHealthScores(summaries)).containsExactly(0, 100);
  }

  @Test
  @DisplayName("주차 요약은 4주로 나누고 각 주의 기록만 집계한다")
  void 주차_요약은_4주로_나눈다() {
    LocalDateTime startTime = LocalDateTime.now().minusWeeks(4);
    List<PooRecord> records =
        List.of(
            record(3, startTime.plusDays(1), "쾌적", "채소"),
            record(1, startTime.plusDays(2), "피로", "밀가루"),
            record(4, startTime.plusWeeks(3).plusDays(1), "쾌적", "채소"));

    List<WeeklySummaryData> summaries = calculator.buildWeeklySummaries(records, startTime);

    assertThat(summaries).hasSize(4);
    assertThat(summaries.get(0).recordCount()).isEqualTo(2);
    assertThat(summaries.get(0).healthyRatio()).isEqualTo(50);
    assertThat(summaries.get(1).recordCount()).isZero();
    assertThat(summaries.get(3).recordCount()).isEqualTo(1);
    assertThat(summaries.get(3).healthyRatio()).isEqualTo(100);
  }

  @Test
  @DisplayName("하루 평균 기록 수는 소수점 첫째 자리까지 반올림한다")
  void 하루_평균_기록_수를_반올림한다() {
    LocalDateTime startTime = LocalDateTime.now().minusDays(7);
    List<PooRecord> records =
        List.of(record(3, startTime), record(4, startTime), record(5, startTime));

    assertThat(calculator.computeAvgDailyRecordCount(records, startTime)).isEqualTo(0.4);
  }

  @Test
  @DisplayName("DAILY 리포트의 집계 시작 시각은 오늘 자정이다")
  void DAILY_시작_시각은_오늘_자정이다() {
    assertThat(calculator.getStartTime(com.daypoo.api.entity.enums.ReportType.DAILY))
        .isEqualTo(LocalDate.now().atStartOfDay());
  }
}
