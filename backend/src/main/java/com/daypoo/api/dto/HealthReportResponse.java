package com.daypoo.api.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.Builder;

@Builder
public record HealthReportResponse(
    String reportType,
    int healthScore,
    String summary,
    String solution,
    String premiumSolution,
    List<String> insights,
    int recordCount,
    LocalDateTime periodStart,
    LocalDateTime periodEnd,
    String analyzedAt,
    Integer mostFrequentBristol,
    String mostFrequentCondition,
    String mostFrequentDiet,
    Integer healthyRatio,
    // MONTHLY 전용
    List<Integer> weeklyHealthScores,
    String improvementTrend,
    Map<Integer, Integer> bristolDistribution,
    Double avgDailyRecordCount) {}
