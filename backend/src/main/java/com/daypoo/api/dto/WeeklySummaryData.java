package com.daypoo.api.dto;

public record WeeklySummaryData(
    int weekNumber, // 1~4
    int recordCount, // 해당 주 기록 수
    double avgBristolScale, // 브리스톨 평균 (소수 1자리)
    int healthyRatio, // 건강 배변 비율 % (bristol 3~4)
    String topDietTags, // 최다 식단 태그 (쉼표 구분, 최대 3개)
    String topConditionTags // 최다 컨디션 태그 (쉼표 구분, 최대 3개)
    ) {}
