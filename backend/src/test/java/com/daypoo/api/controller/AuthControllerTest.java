package com.daypoo.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.PasswordChangeRequest;
import com.daypoo.api.dto.ProfileUpdateRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.dto.UserResponse;
import com.daypoo.api.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** AuthController Standalone MockMvc 테스트. DB, Redis 등 외부 인프라 없이 컨트롤러 레이어만 단독 검증합니다. */
@ExtendWith(MockitoExtension.class)
@DisplayName("인증 컨트롤러 MockMvc 테스트")
class AuthControllerTest {

  private MockMvc mockMvc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Mock private AuthService authService;

  @InjectMocks private AuthController authController;

  // Authentication 파라미터를 가진 엔드포인트에서 사용할 mock principal
  private final UsernamePasswordAuthenticationToken mockAuthentication =
      new UsernamePasswordAuthenticationToken("test@example.com", null, Collections.emptyList());

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
  }

  @Test
  @DisplayName("성공: 내 정보 조회 API")
  void getCurrentUser_success() throws Exception {
    // given
    UserResponse userResponse =
        UserResponse.builder()
            .id(1L)
            .email("test@example.com")
            .nickname("PoopKing")
            .role("ROLE_USER")
            .level(1)
            .exp(20)
            .points(100L)
            .isPro(false)
            .build();

    given(authService.getCurrentUserInfo()).willReturn(userResponse);

    // when & then
    mockMvc
        .perform(get("/api/v1/auth/me").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("test@example.com"))
        .andExpect(jsonPath("$.nickname").value("PoopKing"));
  }

  @Test
  @DisplayName("성공: 프로필 닉네임 수정 API")
  void updateProfile_success() throws Exception {
    // given
    ProfileUpdateRequest request = new ProfileUpdateRequest("NewPoo");
    doNothing()
        .when(authService)
        .updateProfile(eq("test@example.com"), any(ProfileUpdateRequest.class));

    // when & then
    // Authentication 파라미터는 UsernamePasswordAuthenticationToken으로 주입
    mockMvc
        .perform(
            patch("/api/v1/auth/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .principal(mockAuthentication))
        .andExpect(status().isOk());
  }

  @Test
  @DisplayName("성공: 비밀번호 변경 API")
  void changePassword_success() throws Exception {
    // given
    PasswordChangeRequest request = new PasswordChangeRequest("oldPassword123!", "newPassword123!");
    doNothing()
        .when(authService)
        .changePassword(eq("test@example.com"), any(PasswordChangeRequest.class));

    // when & then
    mockMvc
        .perform(
            patch("/api/v1/auth/password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .principal(mockAuthentication))
        .andExpect(status().isOk());
  }

  @Test
  @DisplayName("성공: 이메일 중복 검사 API")
  void checkEmail_success() throws Exception {
    // given
    doNothing().when(authService).checkEmailDuplicate("test@example.com");

    // when & then
    mockMvc
        .perform(
            get("/api/v1/auth/check-email")
                .param("email", "test@example.com")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());
  }

  @Test
  @DisplayName("성공: 일반 회원가입 API")
  void signUp_success() throws Exception {
    // given
    // SignUpRequest 실제 생성자 순서: (password, email, nickname)
    SignUpRequest request = new SignUpRequest("password123!", "test@example.com", "PoopKing");
    doNothing().when(authService).signUp(any(SignUpRequest.class));

    // when & then
    mockMvc
        .perform(
            post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());
  }

  @Test
  @DisplayName("성공: 일반 로그인 API")
  void login_success() throws Exception {
    // given
    LoginRequest request = new LoginRequest("test@example.com", "password123!");
    TokenResponse tokenResponse = new TokenResponse("mockAccessToken", "mockRefreshToken");

    given(authService.login(any(LoginRequest.class))).willReturn(tokenResponse);

    // when & then
    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").value("mockAccessToken"))
        .andExpect(jsonPath("$.refreshToken").value("mockRefreshToken"));
  }
}
