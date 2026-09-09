package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.daypoo.api.dto.PublicSettingsResponse;
import com.daypoo.api.entity.SystemSettings;
import com.daypoo.api.repository.SystemSettingsRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("시스템 설정 서비스 단위 테스트")
class AdminSettingsServiceTest {

  @InjectMocks private AdminSettingsService adminSettingsService;

  @Mock private SystemSettingsRepository systemSettingsRepository;

  private static SystemSettings settings(boolean noticeEnabled, String noticeMessage) {
    return SystemSettings.builder()
        .noticeMessage(noticeMessage)
        .noticeEnabled(noticeEnabled)
        .maintenanceMode(false)
        .signupEnabled(true)
        .aiReportEnabled(true)
        .build();
  }

  @Test
  @DisplayName("공지가 켜져 있으면 문구를 함께 내려준다")
  void getPublicSettings_noticeEnabled() {
    given(systemSettingsRepository.findCurrent())
        .willReturn(Optional.of(settings(true, "점검 예정 안내")));

    PublicSettingsResponse response = adminSettingsService.getPublicSettings();

    assertThat(response.isNoticeEnabled()).isTrue();
    assertThat(response.getNoticeMessage()).isEqualTo("점검 예정 안내");
  }

  @Test
  @DisplayName("공지가 꺼져 있으면 작성해 둔 초안 문구를 노출하지 않는다")
  void getPublicSettings_noticeDisabled() {
    given(systemSettingsRepository.findCurrent())
        .willReturn(Optional.of(settings(false, "아직 게시하지 않은 초안")));

    PublicSettingsResponse response = adminSettingsService.getPublicSettings();

    assertThat(response.isNoticeEnabled()).isFalse();
    assertThat(response.getNoticeMessage()).isNull();
  }

  @Test
  @DisplayName("설정 행이 없어도 예외를 던지지 않고 공지가 꺼진 상태로 응답한다")
  void getPublicSettings_notInitialized() {
    given(systemSettingsRepository.findCurrent()).willReturn(Optional.empty());

    PublicSettingsResponse response = adminSettingsService.getPublicSettings();

    assertThat(response.isNoticeEnabled()).isFalse();
    assertThat(response.getNoticeMessage()).isNull();
  }
}
