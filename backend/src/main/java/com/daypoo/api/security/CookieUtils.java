package com.daypoo.api.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Base64;
import java.util.Optional;

/**
 * OAuth2 인증 플로우에서 사용하는 쿠키 유틸리티. Java 직렬화를 사용하되 Spring의 deprecated SerializationUtils 대신 직접 구현.
 * OAuth2AuthorizationRequest가 Serializable 인터페이스를 구현하므로 Java 직렬화 사용.
 */
public class CookieUtils {

  public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if (cookie.getName().equals(name)) {
          return Optional.of(cookie);
        }
      }
    }
    return Optional.empty();
  }

  public static void addCookie(
      HttpServletResponse response, String name, String value, int maxAge) {
    // SameSite 속성을 포함한 Set-Cookie 헤더를 직접 설정
    // Cookie API는 SameSite를 지원하지 않으므로 헤더로 추가
    String cookieValue =
        String.format(
            "%s=%s; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=%d", name, value, maxAge);
    response.addHeader("Set-Cookie", cookieValue);
  }

  public static void deleteCookie(
      HttpServletRequest request, HttpServletResponse response, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if (cookie.getName().equals(name)) {
          // Set-Cookie 헤더로 삭제 (Max-Age=0)
          String deleteValue =
              String.format("%s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0", name);
          response.addHeader("Set-Cookie", deleteValue);
        }
      }
    }
  }

  /** 객체를 Java 직렬화 후 Base64 URL-safe 인코딩하여 쿠키 저장용 문자열로 변환. */
  public static String serialize(Object object) {
    if (object == null) {
      return "";
    }
    try {
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(org.springframework.util.SerializationUtils.serialize(object));
    } catch (Exception e) {
      throw new RuntimeException("OAuth2 쿠키 직렬화 실패", e);
    }
  }

  /** Base64 URL-safe 디코딩 후 Java 역직렬화. */
  @SuppressWarnings("unchecked")
  public static <T> T deserialize(Cookie cookie, Class<T> cls) {
    if (cookie == null || cookie.getValue() == null || cookie.getValue().isEmpty()) {
      return null;
    }
    try {
      byte[] decoded = Base64.getUrlDecoder().decode(cookie.getValue());
      Object deserialized = org.springframework.util.SerializationUtils.deserialize(decoded);
      return cls.cast(deserialized);
    } catch (Exception e) {
      // 역직렬화 실패 시 예외를 던져 500 에러를 발생시키는 대신 null을 리턴하여 안전하게 처리
      return null;
    }
  }
}
