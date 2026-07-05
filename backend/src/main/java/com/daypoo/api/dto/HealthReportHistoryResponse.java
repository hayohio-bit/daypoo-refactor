package com.daypoo.api.dto;

import com.daypoo.api.entity.HealthReportSnapshot;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record HealthReportHistoryResponse(
    Long id,
    String reportType,
    int healthScore,
    String summary,
    int recordCount,
    LocalDateTime periodStart,
    LocalDateTime periodEnd,
    LocalDateTime createdAt) {

  public static HealthReportHistoryResponse from(HealthReportSnapshot s) {
    return HealthReportHistoryResponse.builder()
        .id(s.getId())
        .reportType(s.getReportType().name())
        .healthScore(s.getHealthScore())
        .summary(s.getSummary())
        .recordCount(s.getRecordCount())
        .periodStart(s.getPeriodStart())
        .periodEnd(s.getPeriodEnd())
        .createdAt(s.getCreatedAt())
        .build();
  }
}
