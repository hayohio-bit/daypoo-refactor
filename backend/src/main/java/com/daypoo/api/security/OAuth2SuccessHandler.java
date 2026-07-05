package com.daypoo.api.security;

import com.daypoo.api.entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  private final JwtProvider jwtProvider;
  private final com.daypoo.api.repository.UserRepository userRepository;
  private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

  @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
  private String frontendUrl;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException, ServletException {
    OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
    OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;

    String registrationId = authToken.getAuthorizedClientRegistrationId();
    String providerId;

    if ("kakao".equals(registrationId)) {
      providerId = String.valueOf(oAuth2User.getAttributes().get("id"));
    } else if ("google".equals(registrationId)) {
      providerId = (String) oAuth2User.getAttributes().get("sub");
    } else {
      providerId = oAuth2User.getName();
    }

    String username = registrationId + "_" + providerId;
    String email;
    if ("kakao".equals(registrationId)) {
      java.util.Map<String, Object> kakaoAccount =
          (java.util.Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
      email =
          kakaoAccount != null && kakaoAccount.get("email") != null
              ? (String) kakaoAccount.get("email")
              : username + "@daypoo.com";
    } else {
      email =
          oAuth2User.getAttributes().get("email") != null
              ? (String) oAuth2User.getAttributes().get("email")
              : username + "@daypoo.com";
    }

    String targetUrl;

    // 가입 여부 확인
    Optional<User> optionalUser = userRepository.findByEmail(email);
    if (optionalUser.isPresent()) {
      User user = optionalUser.get();
      // 기존 회원: 로그인 처리
      String accessToken = jwtProvider.createAccessToken(email, user.getRole().name());
      String refreshToken = jwtProvider.createRefreshToken(email);

      // 보안 개선: JWT를 직접 노출하지 않고 일회용 코드로 교환
      String authCode = java.util.UUID.randomUUID().toString();
      String redisKey = "auth_code:" + authCode;
      String redisValue = accessToken + ":" + refreshToken;
      redisTemplate.opsForValue().set(redisKey, redisValue, java.time.Duration.ofMinutes(1));

      targetUrl = frontendUrl + "/auth/callback?code=" + authCode;
      log.info("Existing OAuth2 User Login Success! Redirecting with authCode: {}", authCode);
    } else {
      // 신규 회원: 닉네임 설정 페이지로 유도
      String registrationToken = jwtProvider.createRegistrationToken(email, "ROLE_USER");
      targetUrl = frontendUrl + "/signup/social?registration_token=" + registrationToken;
      log.info("New OAuth2 User Detected! Redirecting to nickname setup: {}", targetUrl);
    }

    getRedirectStrategy().sendRedirect(request, response, targetUrl);
  }
}
