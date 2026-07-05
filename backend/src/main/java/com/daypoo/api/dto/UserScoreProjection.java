package com.daypoo.api.dto;

public interface UserScoreProjection {
  Long getUserId();

  long getRecordCount();

  long getUniqueToilets();
}
