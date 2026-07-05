package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "system_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SystemSettings extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "notice_message", length = 1000)
  private String noticeMessage;

  @Column(name = "notice_enabled", nullable = false)
  private boolean noticeEnabled = false;

  @Column(name = "maintenance_mode", nullable = false)
  private boolean maintenanceMode = false;

  @Column(name = "signup_enabled", nullable = false)
  private boolean signupEnabled = true;

  @Column(name = "ai_report_enabled", nullable = false)
  private boolean aiReportEnabled = true;

  @Column(name = "default_avatar_item_id")
  private Long defaultAvatarItemId;

  @Builder
  public SystemSettings(
      String noticeMessage,
      boolean noticeEnabled,
      boolean maintenanceMode,
      boolean signupEnabled,
      boolean aiReportEnabled) {
    this.noticeMessage = noticeMessage;
    this.noticeEnabled = noticeEnabled;
    this.maintenanceMode = maintenanceMode;
    this.signupEnabled = signupEnabled;
    this.aiReportEnabled = aiReportEnabled;
  }

  public void update(
      String noticeMessage,
      boolean noticeEnabled,
      boolean maintenanceMode,
      boolean signupEnabled,
      boolean aiReportEnabled) {
    this.noticeMessage = noticeMessage;
    this.noticeEnabled = noticeEnabled;
    this.maintenanceMode = maintenanceMode;
    this.signupEnabled = signupEnabled;
    this.aiReportEnabled = aiReportEnabled;
  }
}
