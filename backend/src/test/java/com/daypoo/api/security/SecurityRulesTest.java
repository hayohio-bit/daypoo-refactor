package com.daypoo.api.security;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.daypoo.api.global.filter.MaintenanceModeFilter;
import com.daypoo.api.service.AdminSettingsService;
import com.daypoo.api.service.CustomOAuth2UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 요청 경로별 접근 규칙을 실제 보안 필터 체인으로 검증한다. 경로 규칙만 확인하므로 요청을 받아 주기만 하는 시험용 컨트롤러를 쓰고, 외부 시스템에 닿는 빈(소셜 로그인
 * 처리, Redis, 점검 모드 조회)만 목으로 대체한다. DB·Redis 컨테이너가 필요 없다.
 *
 * <p>이 테스트가 없으면 매처 순서가 바뀌어 헬스체크가 401 이 되거나 일반 사용자가 metrics 를 읽게 되어도 CI 가 잡지 못한다. 검증 대상은 경로별 접근
 * 규칙뿐이다. actuator 자동 설정이 없고 응답 본문을 보지 않으므로 {@code management.*} 설정(예: health 상세 노출)은 {@link
 * com.daypoo.api.global.config.ProductionConfigTest} 가 따로 검증한다.
 */
@WebMvcTest(controllers = SecurityRulesTest.ProbeController.class)
@Import({
  SecurityConfig.class,
  JwtAuthenticationFilter.class,
  JwtProvider.class,
  MaintenanceModeFilter.class,
  SecurityRulesTest.ProbeController.class
})
@TestPropertySource(
    properties = {
      "app.frontend.url=http://localhost:3000",
      "app.cors.allowed-origins=http://localhost:3000",
      "spring.security.jwt.secret-key=ZGF5cG9vLXRlc3Qtc2VjcmV0LWtleS1kYXlwb28tdGVzdC1zZWNyZXQta2V5Cg==",
      "spring.security.jwt.access-token-validity-in-seconds=3600",
      "spring.security.jwt.refresh-token-validity-in-seconds=86400",
      // oauth2Login 설정이 요구하는 클라이언트 등록(값은 사용되지 않는다)
      "spring.security.oauth2.client.registration.google.client-id=test",
      "spring.security.oauth2.client.registration.google.client-secret=test"
    })
@DisplayName("보안 필터 체인 접근 규칙")
class SecurityRulesTest {

  /** 규칙은 경로로만 판정되므로 각 경로에 응답만 하는 시험용 엔드포인트를 둔다. */
  @RestController
  static class ProbeController {
    @GetMapping({
      "/actuator/health",
      "/actuator/metrics",
      "/actuator/health/liveness",
      "/api/v1/admin/stats",
      "/api/v1/toilets",
      "/api/v1/support/inquiries",
      "/api/v1/settings/public",
      "/api/v1/users/me"
    })
    String ok() {
      return "ok";
    }

    @PostMapping({"/api/v1/records/check-in", "/api/v1/toilets"})
    String checkIn() {
      return "ok";
    }
  }

  @Autowired private MockMvc mockMvc;
  @Autowired private JwtProvider jwtProvider;

  @MockitoBean private StringRedisTemplate redisTemplate;
  @MockitoBean private AdminSettingsService adminSettingsService;
  @MockitoBean private CustomOAuth2UserService customOAuth2UserService;
  @MockitoBean private OAuth2SuccessHandler oAuth2SuccessHandler;
  @MockitoBean private HttpCookieOAuth2AuthorizationRequestRepository cookieRepository;

  private String bearer(String token) {
    return "Bearer " + token;
  }

  private String userToken() {
    return bearer(jwtProvider.createAccessToken("user@example.com", "ROLE_USER"));
  }

  private String adminToken() {
    return bearer(jwtProvider.createAccessToken("admin@example.com", "ROLE_ADMIN"));
  }

  @BeforeEach
  void setUp() {
    given(adminSettingsService.isMaintenanceMode()).willReturn(false);
  }

  @Nested
  @DisplayName("익명 사용자")
  class Anonymous {

    @Test
    @DisplayName("헬스체크, 화장실 조회, 공개 설정은 허용한다")
    void publicEndpoints() throws Exception {
      mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
      mockMvc.perform(get("/api/v1/toilets")).andExpect(status().isOk());
      mockMvc.perform(get("/api/v1/settings/public")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("metrics, 관리자 API, 체크인, 내 정보는 401")
    void protectedEndpoints() throws Exception {
      mockMvc.perform(get("/actuator/metrics")).andExpect(status().isUnauthorized());
      mockMvc.perform(get("/api/v1/admin/stats")).andExpect(status().isUnauthorized());
      mockMvc.perform(post("/api/v1/records/check-in")).andExpect(status().isUnauthorized());
      mockMvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("화장실 조회(GET)만 공개이고 등록(POST)과 문의 목록은 401")
    void onlyToiletReadsArePublic() throws Exception {
      mockMvc.perform(post("/api/v1/toilets")).andExpect(status().isUnauthorized());
      mockMvc.perform(get("/api/v1/support/inquiries")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("헬스체크 하위 경로는 공개가 아니다(향후 probes 를 쓰면 허용 규칙을 함께 고쳐야 한다)")
    void healthSubPathsAreNotPublic() throws Exception {
      mockMvc.perform(get("/actuator/health/liveness")).andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("일반 사용자")
  class RegularUser {

    @Test
    @DisplayName("체크인과 내 정보는 허용한다")
    void allowed() throws Exception {
      mockMvc
          .perform(post("/api/v1/records/check-in").header("Authorization", userToken()))
          .andExpect(status().isOk());
      mockMvc
          .perform(get("/api/v1/users/me").header("Authorization", userToken()))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("관리자 API 와 metrics 는 403")
    void forbidden() throws Exception {
      mockMvc
          .perform(get("/api/v1/admin/stats").header("Authorization", userToken()))
          .andExpect(status().isForbidden());
      mockMvc
          .perform(get("/actuator/metrics").header("Authorization", userToken()))
          .andExpect(status().isForbidden());
    }
  }

  @Nested
  @DisplayName("관리자")
  class Admin {

    @Test
    @DisplayName("관리자 API 와 metrics 를 읽을 수 있다")
    void allowed() throws Exception {
      mockMvc
          .perform(get("/api/v1/admin/stats").header("Authorization", adminToken()))
          .andExpect(status().isOk());
      mockMvc
          .perform(get("/actuator/metrics").header("Authorization", adminToken()))
          .andExpect(status().isOk());
    }
  }

  @Nested
  @DisplayName("용도가 정해진 토큰")
  class PurposeBoundTokens {

    @Test
    @DisplayName("가입 대기용 토큰은 관리자 이메일이어도 어떤 API 도 인증하지 못한다")
    void registrationTokenIsNeverAuthentication() throws Exception {
      String token = bearer(jwtProvider.createRegistrationToken("admin@example.com", "ROLE_ADMIN"));

      mockMvc
          .perform(get("/api/v1/admin/stats").header("Authorization", token))
          .andExpect(status().isUnauthorized());
      mockMvc
          .perform(post("/api/v1/records/check-in").header("Authorization", token))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SSE 토큰은 구독 경로 밖의 API 를 인증하지 못한다")
    void sseTokenOnlyForSubscribe() throws Exception {
      String token = bearer(jwtProvider.createSseToken("user@example.com", "ROLE_USER"));

      mockMvc
          .perform(post("/api/v1/records/check-in").header("Authorization", token))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그아웃으로 블랙리스트에 오른 액세스 토큰은 거부한다")
    void blacklistedTokenRejected() throws Exception {
      String raw = jwtProvider.createAccessToken("user@example.com", "ROLE_USER");
      given(redisTemplate.hasKey("blacklist:" + raw)).willReturn(true);

      mockMvc
          .perform(post("/api/v1/records/check-in").header("Authorization", bearer(raw)))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("점검 모드")
  class MaintenanceMode {

    @BeforeEach
    void turnOn() {
      given(adminSettingsService.isMaintenanceMode()).willReturn(true);
    }

    @Test
    @DisplayName("헬스체크는 통과해 컨테이너가 unhealthy 로 표시되지 않는다")
    void healthCheckPasses() throws Exception {
      mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("공개 경로여도 익명 요청은 503 이고 점검 오류 코드를 담는다")
    void anonymousBlockedWithMaintenanceCode() throws Exception {
      mockMvc
          .perform(get("/api/v1/toilets"))
          .andExpect(status().isServiceUnavailable())
          .andExpect(jsonPath("$.code").value("G002"));
    }

    @Test
    @DisplayName("일반 사용자 요청은 503, 관리자는 통과한다")
    void regularUserBlockedAdminPasses() throws Exception {
      mockMvc
          .perform(post("/api/v1/records/check-in").header("Authorization", userToken()))
          .andExpect(status().isServiceUnavailable());
      mockMvc
          .perform(post("/api/v1/records/check-in").header("Authorization", adminToken()))
          .andExpect(status().isOk());
    }
  }
}
