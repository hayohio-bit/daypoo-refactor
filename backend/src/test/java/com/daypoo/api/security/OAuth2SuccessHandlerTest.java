package com.daypoo.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("OAuth2 로그인 성공 핸들러 테스트")
class OAuth2SuccessHandlerTest {

  @InjectMocks private OAuth2SuccessHandler handler;

  @Mock private JwtProvider jwtProvider;
  @Mock private UserRepository userRepository;
  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ValueOperations<String, String> valueOperations;
  @Mock private RefreshTokenStore refreshTokenStore;

  private MockHttpServletRequest request;
  private MockHttpServletResponse response;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(handler, "frontendUrl", "https://daypoo.example");
    ReflectionTestUtils.setField(handler, "adminEmailsString", "");
    request = new MockHttpServletRequest();
    response = new MockHttpServletResponse();
  }

  private OAuth2AuthenticationToken googleLogin(String email) {
    DefaultOAuth2User principal =
        new DefaultOAuth2User(
            List.of(new SimpleGrantedAuthority("ROLE_USER")),
            Map.of("sub", "google-123", "email", email),
            "sub");
    return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
  }

  @Test
  @DisplayName("기존 회원: 리프레시 토큰을 저장소에 저장하고 일회용 코드로 리다이렉트한다")
  void existingUser_storesRefreshTokenAndRedirectsWithCode() throws Exception {
    User user =
        User.builder()
            .email("social@example.com")
            .nickname("Social")
            .password("pw")
            .role(Role.ROLE_USER)
            .build();
    given(userRepository.findByEmail("social@example.com")).willReturn(Optional.of(user));
    given(jwtProvider.createAccessToken("social@example.com", "ROLE_USER")).willReturn("at");
    given(jwtProvider.createRefreshToken("social@example.com")).willReturn("rt");
    given(redisTemplate.opsForValue()).willReturn(valueOperations);

    handler.onAuthenticationSuccess(request, response, googleLogin("social@example.com"));

    verify(refreshTokenStore).save("social@example.com", "rt");
    assertThat(response.getRedirectedUrl())
        .startsWith("https://daypoo.example/auth/callback?code=");
  }

  @Test
  @DisplayName("신규 회원: 리프레시 토큰을 만들지 않고 가입 페이지로 리다이렉트한다")
  void newUser_doesNotStoreRefreshToken() throws Exception {
    given(userRepository.findByEmail("new@example.com")).willReturn(Optional.empty());
    given(jwtProvider.createRegistrationToken("new@example.com", "ROLE_USER")).willReturn("reg");

    handler.onAuthenticationSuccess(request, response, googleLogin("new@example.com"));

    verify(refreshTokenStore, never()).save(anyString(), anyString());
    assertThat(response.getRedirectedUrl())
        .isEqualTo("https://daypoo.example/signup/social?registration_token=reg");
  }
}
