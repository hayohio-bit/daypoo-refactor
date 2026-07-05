package com.daypoo.api.dto;

import com.daypoo.api.entity.SystemSettings;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class SystemSettingsResponse {
  private String noticeMessage;
  private boolean noticeEnabled;
  private boolean maintenanceMode;
  private boolean signupEnabled;
  private boolean aiReportEnabled;

  public static SystemSettingsResponse from(SystemSettings entity) {
    if (entity == null) return null;
    return SystemSettingsResponse.builder()
        .noticeMessage(entity.getNoticeMessage())
        .noticeEnabled(entity.isNoticeEnabled())
        .maintenanceMode(entity.isMaintenanceMode())
        .signupEnabled(entity.isSignupEnabled())
        .aiReportEnabled(entity.isAiReportEnabled())
        .build();
  }
}
