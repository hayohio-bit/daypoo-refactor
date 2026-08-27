package com.daypoo.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Base64;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.jackson2.SecurityJackson2Modules;

/**
 * OAuth2 인증 플로우에서 사용하는 쿠키 유틸리티.
 *
 * <p>직렬화는 Jackson JSON을 사용한다. 쿠키는 클라이언트가 임의로 조작할 수 있는 값이므로 Java 직렬화(역직렬화 가젯 공격 표면)를 쓰지 않고, Spring
 * Security가 허용 목록 기반으로 제공하는 Jackson 모듈로 역직렬화한다.
 */
@Slf4j
public class CookieUtils {

  private static final ObjectMapper OBJECT_MAPPER = createObjectMapper();

  private static ObjectMapper createObjectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModules(SecurityJackson2Modules.getModules(CookieUtils.class.getClassLoader()));
    return mapper;
  }

  public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
    return Optional.ofNullable(org.springframework.web.util.WebUtils.getCookie(request, name));
  }

  public static void addCookie(
      HttpServletResponse response, String name, String value, int maxAge, boolean secure) {
    ResponseCookie cookie =
        ResponseCookie.from(name, value)
            .path("/")
            .httpOnly(true)
            .secure(secure)
            .sameSite("Lax")
            .maxAge(maxAge)
            .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  public static void deleteCookie(HttpServletResponse response, String name, boolean secure) {
    addCookie(response, name, "", 0, secure);
  }

  /** 객체를 JSON 직렬화 후 Base64 URL-safe 인코딩하여 쿠키 저장용 문자열로 변환. */
  public static String serialize(Object object) {
    if (object == null) {
      return "";
    }
    try {
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(OBJECT_MAPPER.writeValueAsBytes(object));
    } catch (Exception e) {
      throw new IllegalStateException("OAuth2 쿠키 직렬화 실패", e);
    }
  }

  /** Base64 URL-safe 디코딩 후 JSON 역직렬화. 손상되었거나 형식이 다른 쿠키는 null을 반환한다. */
  public static <T> T deserialize(Cookie cookie, Class<T> cls) {
    if (cookie == null || cookie.getValue() == null || cookie.getValue().isEmpty()) {
      return null;
    }
    try {
      byte[] decoded = Base64.getUrlDecoder().decode(cookie.getValue());
      return OBJECT_MAPPER.readValue(decoded, cls);
    } catch (Exception e) {
      // 클라이언트가 보낸 값이므로 실패는 정상 시나리오다. 500 대신 null을 반환해 인증 플로우를 재시작하게 한다.
      log.warn("OAuth2 쿠키 역직렬화 실패 (쿠키명: {}): {}", cookie.getName(), e.getMessage());
      return null;
    }
  }
}
