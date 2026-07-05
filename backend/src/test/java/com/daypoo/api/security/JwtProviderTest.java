package com.daypoo.api.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class JwtProviderTest {

  private JwtProvider jwtProvider;

  @BeforeEach
  void setUp() {
    // 256-bit 이상 크기의 Base64 인코딩된 시크릿 키
    String testSecretKey = "ZGF5cG9vLXRlc3Qtc2VjcmV0LWtleS1kYXlwb28tdGVzdC1zZWNyZXQta2V5Cg==";
    long accessTokenValidity = 3600; // 1시간
    long refreshTokenValidity = 86400; // 1일

    jwtProvider = new JwtProvider(testSecretKey, accessTokenValidity, refreshTokenValidity);
  }

  @Test
  @DisplayName("Access Token 발급 및 검증 - 정상 케이스")
  void createAndValidateAccessToken() {
    String email = "test@example.com";
    String role = "ROLE_USER";

    String token = jwtProvider.createAccessToken(email, role);

    assertThat(token).isNotBlank();
    assertThat(jwtProvider.validateToken(token)).isTrue();

    Claims claims = jwtProvider.getClaims(token);
    assertThat(claims.getSubject()).isEqualTo(email);
    assertThat(claims.get("role")).isEqualTo(role);
    assertThat(claims.get("type")).isNull(); // 일반 Access Token은 별도 type 클레임이 없음
  }

  @Test
  @DisplayName("Refresh Token 발급 및 검증 - 정상 케이스")
  void createAndValidateRefreshToken() {
    String email = "test@example.com";

    String token = jwtProvider.createRefreshToken(email);

    assertThat(token).isNotBlank();
    assertThat(jwtProvider.validateToken(token)).isTrue();

    Claims claims = jwtProvider.getClaims(token);
    assertThat(claims.getSubject()).isEqualTo(email);
  }

  @Test
  @DisplayName("SSE Token 발급 - 특정 type 속성 확인")
  void createSseToken() {
    String email = "sse@example.com";
    String role = "ROLE_USER";

    String token = jwtProvider.createSseToken(email, role);

    assertThat(jwtProvider.validateToken(token)).isTrue();

    Claims claims = jwtProvider.getClaims(token);
    assertThat(claims.getSubject()).isEqualTo(email);
    assertThat(claims.get("type")).isEqualTo("sse");
  }

  @Test
  @DisplayName("Registration Token 발급 - 특정 type 속성 확인")
  void createRegistrationToken() {
    String email = "newuser@example.com";
    String role = "ROLE_GUEST";

    String token = jwtProvider.createRegistrationToken(email, role);

    assertThat(jwtProvider.validateToken(token)).isTrue();

    Claims claims = jwtProvider.getClaims(token);
    assertThat(claims.getSubject()).isEqualTo(email);
    assertThat(claims.get("email")).isEqualTo(email);
    assertThat(claims.get("type")).isEqualTo("registration");
  }

  @Test
  @DisplayName("잘못된 토큰 검증 시 false 반환")
  void validateToken_invalidToken() {
    String invalidToken = "this.is.invalid.token";

    boolean isValid = jwtProvider.validateToken(invalidToken);

    assertThat(isValid).isFalse();
  }

  @Test
  @DisplayName("토큰 남은 시간 조회 - 양수 반환")
  void getRemainingTime() {
    String email = "time@example.com";
    String token = jwtProvider.createAccessToken(email, "ROLE_USER");

    long remainingTime = jwtProvider.getRemainingTime(token);

    assertThat(remainingTime).isGreaterThan(0L);
    assertThat(remainingTime).isLessThanOrEqualTo(3600L * 1000L);
  }
}
