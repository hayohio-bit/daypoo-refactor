package com.daypoo.api.controller;

import com.daypoo.api.dto.PublicSettingsResponse;
import com.daypoo.api.service.AdminSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 없이 호출할 수 있는 설정 조회 API 다.
 *
 * <p>쓰기 경로는 {@link AdminController} 의 {@code /api/v1/admin/settings} 가 그대로 담당한다. 읽기와 쓰기를 다른 경로로 갈라
 * 두어야 공개 범위를 통제할 수 있다.
 */
@Tag(name = "Settings", description = "공개 시스템 설정 조회 API")
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

  private final AdminSettingsService adminSettingsService;

  @Operation(
      summary = "공개 시스템 설정 조회",
      description = "공지 배너 노출 여부와 문구 등 비로그인 사용자에게도 필요한 설정값을 반환합니다.")
  @GetMapping("/public")
  public ResponseEntity<PublicSettingsResponse> getPublicSettings() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(1)).cachePublic())
        .body(adminSettingsService.getPublicSettings());
  }
}
