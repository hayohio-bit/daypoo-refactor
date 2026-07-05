package com.daypoo.api.entity.enums;

public enum SubscriptionPlan {
  BASIC(0, "무료 플랜"), // 기본 무료
  PRO(4900, "PRO 플랜"), // 7일/30일 리포트
  PREMIUM(9900, "PREMIUM 플랜"); // AI 맞춤 식단 조언 포함

  private final long monthlyPrice;
  private final String displayName;

  SubscriptionPlan(long monthlyPrice, String displayName) {
    this.monthlyPrice = monthlyPrice;
    this.displayName = displayName;
  }

  public long getMonthlyPrice() {
    return monthlyPrice;
  }

  public String getDisplayName() {
    return displayName;
  }

  /** 금액으로 플랜 찾기 */
  public static SubscriptionPlan fromAmount(long amount) {
    for (SubscriptionPlan plan : values()) {
      if (plan.monthlyPrice == amount) {
        return plan;
      }
    }
    return BASIC; // 기본값
  }
}
