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
  private long totalRevenue;
  private long todayApiCalls;
  private List<DailyStat> weeklyTrend;
  private UserDistribution userDistribution;

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DailyStat {
    private String date;
    private long users;
    private long inquiries;
    private long sales;
  }

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserDistribution {
    private long pro;
    private long basic;
    private long free;
  }
}
