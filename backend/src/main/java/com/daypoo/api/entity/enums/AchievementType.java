package com.daypoo.api.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AchievementType {
  TOTAL_RECORDS("총 기록 횟수"),
  UNIQUE_TOILETS("방문 화장실 수"),
  CONSECUTIVE_DAYS("연속 기록 일수"),
  SAME_TOILET_VISITS("같은 화장실 방문 횟수"),
  LEVEL_REACHED("레벨 달성");

  private final String label;
}
