package com.daypoo.api.dto;

public interface UserRegionScoreProjection {
  Long getUserId();

  String getRegionName();

  long getRecordCount();

  long getUniqueToilets();
}
