package com.daypoo.api.global.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

import com.daypoo.api.service.AdminSettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@DisplayName("점검 모드 필터 테스트")
class MaintenanceModeFilterTest {

  @Mock private AdminSettingsService adminSettingsService;

  private MaintenanceModeFilter filter;

  @BeforeEach
  void setUp() {
    filter =
        new MaintenanceModeFilter(
            adminSettingsService, new ObjectMapper().registerModule(new JavaTimeModule()));
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private MockHttpServletResponse run(String path) throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
    request.setRequestURI(path);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();
    filter.doFilter(request, response, chain);
    return response;
  }

  @Test
  @DisplayName("점검 모드에서도 헬스체크는 통과한다")
  void healthCheck_passesDuringMaintenance() throws Exception {
    MockHttpServletResponse response = run("/actuator/health");

    // 차단되면 503 이고 컨테이너가 unhealthy 로 표시되어 점검 중 배포 대기 루프가 실패한다.
    // 설정 조회 자체를 하지 않으므로 헬스체크마다 DB 를 읽지도 않는다.
    assertThat(response.getStatus()).isEqualTo(200);
    verifyNoInteractions(adminSettingsService);
  }

  @Test
  @DisplayName("점검 모드에서 일반 API 는 503 으로 막는다")
  void regularApi_blockedDuringMaintenance() throws Exception {
    given(adminSettingsService.isMaintenanceMode()).willReturn(true);

    MockHttpServletResponse response = run("/api/v1/toilets");

    assertThat(response.getStatus()).isEqualTo(503);
  }

  @Test
  @DisplayName("점검 모드가 아니면 일반 API 는 통과한다")
  void regularApi_passesWhenNotInMaintenance() throws Exception {
    given(adminSettingsService.isMaintenanceMode()).willReturn(false);

    assertThat(run("/api/v1/toilets").getStatus()).isEqualTo(200);
  }
}
