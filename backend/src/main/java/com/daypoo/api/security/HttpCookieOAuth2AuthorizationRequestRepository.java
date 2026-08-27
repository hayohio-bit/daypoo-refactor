package com.daypoo.api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
    implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

  public static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request";
  private static final int COOKIE_EXPIRE_SECONDS = 180;

  // http 로컬 환경에서는 false로 두어야 브라우저가 쿠키를 저장한다 (localhost는 예외적으로 허용되지만 명시적 제어를 위해 설정화)
  @Value("${app.cookie.secure:true}")
  private boolean secureCookie;

  @Override
  public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
    return CookieUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
        .map(cookie -> CookieUtils.deserialize(cookie, OAuth2AuthorizationRequest.class))
        .orElse(null);
  }

  @Override
  public void saveAuthorizationRequest(
      OAuth2AuthorizationRequest authorizationRequest,
      HttpServletRequest request,
      HttpServletResponse response) {
    if (authorizationRequest == null) {
      CookieUtils.deleteCookie(response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, secureCookie);
      return;
    }

    CookieUtils.addCookie(
        response,
        OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME,
        CookieUtils.serialize(authorizationRequest),
        COOKIE_EXPIRE_SECONDS,
        secureCookie);
  }

  @Override
  public OAuth2AuthorizationRequest removeAuthorizationRequest(
      HttpServletRequest request, HttpServletResponse response) {
    OAuth2AuthorizationRequest authorizationRequest = this.loadAuthorizationRequest(request);
    // 쿠키를 실제로 삭제하여 stale 쿠키로 인한 state 불일치 방지
    removeAuthorizationRequestCookies(request, response);
    return authorizationRequest;
  }

  public void removeAuthorizationRequestCookies(
      HttpServletRequest request, HttpServletResponse response) {
    CookieUtils.deleteCookie(response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, secureCookie);
  }
}
