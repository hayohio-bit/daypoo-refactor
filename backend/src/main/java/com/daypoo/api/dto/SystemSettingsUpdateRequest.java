package com.daypoo.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Schema(description = "시스템 설정 업데이트 요청")
public class SystemSettingsUpdateRequest {

  @Schema(description = "공지사항 메시지", example = "현재 점검 중입니다.")
  private String noticeMessage;

  @Schema(description = "공지사항 노출 여부")
  @NotNull
  private boolean noticeEnabled;

  @Schema(description = "점검 모드 활성화 여부")
  @NotNull
  private boolean maintenanceMode;

  @Schema(description = "신규 회원가입 허용 여부")
  @NotNull
  private boolean signupEnabled;

  @Schema(description = "AI 분석 리포트 생성 허용 여부")
  @NotNull
  private boolean aiReportEnabled;
}
