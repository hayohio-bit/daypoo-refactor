package com.daypoo.api.dto;

import java.util.List;

public record AiMonthlyReportRequest(
    String userId,
    String reportType, // "MONTHLY"
    List<WeeklySummaryData> weeklySummaries,
    boolean isPremium) {}
