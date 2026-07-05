package com.daypoo.api.dto;

import java.util.List;

public record AiReportRequest(
    String userId, String reportType, List<PooRecordData> records, boolean isPremium) {
  public record PooRecordData(
      Integer bristolScale,
      String color,
      String conditionTags,
      String dietTags,
      String createdAt) {}
}
