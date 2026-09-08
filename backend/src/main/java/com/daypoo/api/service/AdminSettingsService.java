package com.daypoo.api.service;

import com.daypoo.api.dto.PublicSettingsResponse;
import com.daypoo.api.dto.SystemSettingsResponse;
import com.daypoo.api.dto.SystemSettingsUpdateRequest;
import com.daypoo.api.entity.SystemSettings;
import com.daypoo.api.repository.SystemSettingsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminSettingsService {

  private final SystemSettingsRepository systemSettingsRepository;

  @PostConstruct
  public void initSettings() {
    if (systemSettingsRepository.count() == 0) {
      log.info("Initializing system settings...");
      SystemSettings defaultSettings =
          SystemSettings.builder()
              .noticeMessage("Day Poo에 오신 것을 환영합니다!")
              .noticeEnabled(false)
              .maintenanceMode(false)
              .signupEnabled(true)
              .aiReportEnabled(true)
              .build();
      systemSettingsRepository.save(defaultSettings);
    }
  }

  @Transactional(readOnly = true)
  public SystemSettingsResponse getSettings() {
    SystemSettings settings =
        systemSettingsRepository
            .findCurrent()
            .orElseThrow(() -> new IllegalStateException("System settings not initialized"));
    return SystemSettingsResponse.from(settings);
  }

  @Transactional
  public SystemSettingsResponse updateSettings(SystemSettingsUpdateRequest request) {
    SystemSettings settings =
        systemSettingsRepository
            .findCurrent()
            .orElseThrow(() -> new IllegalStateException("System settings not initialized"));

    settings.update(
        request.getNoticeMessage(),
        request.isNoticeEnabled(),
        request.isMaintenanceMode(),
        request.isSignupEnabled(),
        request.isAiReportEnabled());

    return SystemSettingsResponse.from(settings);
  }

  /**
   * 비로그인 사용자에게도 내려보내는 공개 설정값을 조회한다.
   *
   * <p>{@link #getSettings()} 와 달리 설정 행이 없어도 예외를 던지지 않는다. 공지 배너는 부가 기능이므로, 설정을 읽지 못했다고 해서 화면 진입을 막을
   * 이유가 없기 때문이다.
   */
  @Transactional(readOnly = true)
  public PublicSettingsResponse getPublicSettings() {
    return systemSettingsRepository
        .findCurrent()
        .map(PublicSettingsResponse::from)
        .orElseGet(PublicSettingsResponse::disabled);
  }

  @Transactional(readOnly = true)
  public boolean isMaintenanceMode() {
    return systemSettingsRepository
        .findCurrent()
        .map(SystemSettings::isMaintenanceMode)
        .orElse(false);
  }

  @Transactional(readOnly = true)
  public boolean isSignupEnabled() {
    return systemSettingsRepository.findCurrent().map(SystemSettings::isSignupEnabled).orElse(true);
  }

  @Transactional(readOnly = true)
  public boolean isAiReportEnabled() {
    return systemSettingsRepository
        .findCurrent()
        .map(SystemSettings::isAiReportEnabled)
        .orElse(true);
  }
}
