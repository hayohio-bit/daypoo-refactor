package com.daypoo.api.entity.enums;

import java.time.LocalDateTime;

public enum BillingCycle {
  MONTHLY(1, "월간"),
  YEARLY(12, "연간");

  private final int months;
  private final String displayName;

  BillingCycle(int months, String displayName) {
    this.months = months;
    this.displayName = displayName;
  }

  public int getMonths() {
    return months;
  }

  public String getDisplayName() {
    return displayName;
  }

  /** 현재 시간 기준으로 만료일 계산 */
  public LocalDateTime calculateEndDate(LocalDateTime startDate) {
    return startDate.plusMonths(months);
  }
}
