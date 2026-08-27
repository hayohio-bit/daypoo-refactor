package com.daypoo.api.security;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.Cookie;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

@DisplayName("OAuth2 쿠키 유틸 단위 테스트")
class CookieUtilsTest {

  private static final String COOKIE_NAME = "oauth2_auth_request";

  private OAuth2AuthorizationRequest sampleRequest() {
    return OAuth2AuthorizationRequest.authorizationCode()
        .authorizationUri("https://kauth.kakao.com/oauth/authorize")
        .clientId("kakao-client-id")
        .redirectUri("http://localhost:8080/login/oauth2/code/kakao")
        .scopes(Set.of("profile_nickname", "account_email"))
        .state("state-123")
        .additionalParameters(Map.of("nonce", "abc"))
        .attributes(Map.of("registration_id", "kakao"))
        .build();
  }

  @Test
  @DisplayName("OAuth2AuthorizationRequest를 JSON으로 직렬화 후 역직렬화하면 핵심 필드가 보존된다")
  void serializeDeserialize_roundTrip() {
    OAuth2AuthorizationRequest original = sampleRequest();

    String serialized = CookieUtils.serialize(original);
    OAuth2AuthorizationRequest restored =
        CookieUtils.deserialize(
            new Cookie(COOKIE_NAME, serialized), OAuth2AuthorizationRequest.class);

    assertThat(restored).isNotNull();
    assertThat(restored.getAuthorizationUri()).isEqualTo(original.getAuthorizationUri());
    assertThat(restored.getClientId()).isEqualTo(original.getClientId());
    assertThat(restored.getRedirectUri()).isEqualTo(original.getRedirectUri());
    assertThat(restored.getScopes()).isEqualTo(original.getScopes());
    assertThat(restored.getState()).isEqualTo(original.getState());
    assertThat(restored.getAttributes()).containsEntry("registration_id", "kakao");
  }

  @Test
  @DisplayName("조작되었거나 형식이 다른 쿠키 값은 예외 없이 null을 반환한다")
  void deserialize_tamperedValue_returnsNull() {
    // Base64는 맞지만 JSON이 아닌 값 (기존 Java 직렬화 쿠키도 이 경로로 무해하게 무시된다)
    String notJson =
        java.util.Base64.getUrlEncoder().withoutPadding().encodeToString("garbage".getBytes());
    assertThat(
            CookieUtils.deserialize(
                new Cookie(COOKIE_NAME, notJson), OAuth2AuthorizationRequest.class))
        .isNull();

    // Base64조차 아닌 값
    assertThat(
            CookieUtils.deserialize(
                new Cookie(COOKIE_NAME, "%%%not-base64%%%"), OAuth2AuthorizationRequest.class))
        .isNull();

    // 빈 값
    assertThat(
            CookieUtils.deserialize(new Cookie(COOKIE_NAME, ""), OAuth2AuthorizationRequest.class))
        .isNull();
  }

  @Test
  @DisplayName("addCookie는 HttpOnly, SameSite=Lax, Max-Age 속성을 포함한 Set-Cookie 헤더를 설정한다")
  void addCookie_setsAttributes() {
    MockHttpServletResponse response = new MockHttpServletResponse();

    CookieUtils.addCookie(response, COOKIE_NAME, "value123", 180, true);

    String header = response.getHeader("Set-Cookie");
    assertThat(header)
        .contains(COOKIE_NAME + "=value123")
        .contains("Path=/")
        .contains("HttpOnly")
        .contains("Secure")
        .contains("SameSite=Lax")
        .contains("Max-Age=180");
  }

  @Test
  @DisplayName("secure=false로 추가한 쿠키에는 Secure 속성이 없다")
  void addCookie_withoutSecure() {
    MockHttpServletResponse response = new MockHttpServletResponse();

    CookieUtils.addCookie(response, COOKIE_NAME, "v", 180, false);

    assertThat(response.getHeader("Set-Cookie")).doesNotContain("Secure");
  }
}
