package com.daypoo.api.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
  private long totalUsers;
  private long totalToilets;
  private long pendingInquiries;
  private long todayNewUsers;
  private long todayInquiries;
  private long todayApiCalls;
  private List<DailyStat> weeklyTrend;

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DailyStat {
    private String date;
    private long users;
    private long inquiries;
  }
}
