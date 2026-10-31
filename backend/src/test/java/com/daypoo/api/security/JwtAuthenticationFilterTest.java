package com.daypoo.api.security;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@DisplayName("JWT 인증 필터 테스트")
class JwtAuthenticationFilterTest {

  private JwtProvider jwtProvider;
  private StringRedisTemplate redisTemplate;
  private JwtAuthenticationFilter filter;

  @BeforeEach
  void setUp() {
    String testSecretKey = "ZGF5cG9vLXRlc3Qtc2VjcmV0LWtleS1kYXlwb28tdGVzdC1zZWNyZXQta2V5Cg==";
    jwtProvider = new JwtProvider(testSecretKey, 3600, 86400);
    redisTemplate = Mockito.mock(StringRedisTemplate.class);
    filter = new JwtAuthenticationFilter(jwtProvider, redisTemplate);
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  /** Authorization 헤더 또는 쿼리 파라미터로 토큰을 실어 필터를 통과시키고 결과 인증 정보를 돌려준다. */
  private Authentication run(String path, String token, boolean asQueryParam)
      throws IOException, ServletException {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
    request.setRequestURI(path);
    if (asQueryParam) {
      request.setParameter("token", token);
    } else {
      request.addHeader("Authorization", "Bearer " + token);
    }
    filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
    return SecurityContextHolder.getContext().getAuthentication();
  }

  @Test
  @DisplayName("액세스 토큰은 일반 API 경로에서 인증된다")
  void accessToken_authenticates() throws Exception {
    String token = jwtProvider.createAccessToken("user@example.com", "ROLE_USER");

    Authentication auth = run("/api/v1/users/me", token, false);

    assertThat(auth).isNotNull();
    assertThat(auth.getName()).isEqualTo("user@example.com");
  }

  @Test
  @DisplayName("가입 대기용 registration 토큰은 어떤 경로에서도 인증되지 않는다")
  void registrationToken_neverAuthenticates() throws Exception {
    String token = jwtProvider.createRegistrationToken("admin@daypoo.com", "ROLE_ADMIN");

    assertThat(run("/api/v1/admin/stats", token, false)).isNull();
    SecurityContextHolder.clearContext();
    assertThat(run("/api/v1/notifications/subscribe", token, true)).isNull();
  }

  @Test
  @DisplayName("SSE 토큰은 구독 경로에서만 인증된다")
  void sseToken_onlyOnSubscribePath() throws Exception {
    String token = jwtProvider.createSseToken("user@example.com", "ROLE_USER");

    assertThat(run("/api/v1/users/me", token, false)).isNull();
    SecurityContextHolder.clearContext();

    Authentication auth = run("/api/v1/notifications/subscribe", token, true);
    assertThat(auth).isNotNull();
    assertThat(auth.getName()).isEqualTo("user@example.com");
  }
}
