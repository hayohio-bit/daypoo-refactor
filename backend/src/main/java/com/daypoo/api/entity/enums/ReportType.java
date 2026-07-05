package com.daypoo.api.entity.enums;

public enum ReportType {
  DAILY(0), // 무료
  WEEKLY(50), // 50 Gold
  MONTHLY(150); // 150 Gold

  private final long price;

  ReportType(long price) {
    this.price = price;
  }

  public long getPrice() {
    return price;
  }
}
