package com.daypoo.api.entity.enums;

public enum SubscriptionStatus {
  ACTIVE, // 활성 (사용 가능)
  CANCELLED, // 취소됨 (만료일까지 사용 가능)
  EXPIRED // 만료됨 (사용 불가)
}
