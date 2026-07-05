package com.daypoo.api.controller;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.PasswordChangeRequest;
import com.daypoo.api.dto.ProfileUpdateRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.SocialSignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.dto.UserResponse;
import com.daypoo.api.global.aop.RateLimit;
import com.daypoo.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "인증 및 회원가입 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @Operation(summary = "내 정보 조회", description = "현재 로그인한 사용자의 프로필 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "401", description = "인증 실패 (토큰 오류)")
  @GetMapping("/me")
  public ResponseEntity<UserResponse> getCurrentUser() {
    UserResponse response = authService.getCurrentUserInfo();
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "프로필 수정", description = "로그인한 사용자의 닉네임을 수정합니다.")
  @ApiResponse(responseCode = "200", description = "프로필 수정 성공")
  @PatchMapping({"/me", "/profile"})
  public ResponseEntity<String> updateProfile(
      Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
    authService.updateProfile(authentication.getName(), request);
    return ResponseEntity.ok("프로필이 수정되었습니다.");
  }

  @Operation(summary = "비밀번호 변경", description = "현재 비밀번호 확인 후 새로운 비밀번호로 변경합니다.")
  @ApiResponse(responseCode = "200", description = "비밀번호 변경 성공")
  @ApiResponse(responseCode = "400", description = "비밀번호 불일치 또는 유효성 검사 실패")
  @PatchMapping("/password")
  public ResponseEntity<String> changePassword(
      Authentication authentication, @Valid @RequestBody PasswordChangeRequest request) {
    authService.changePassword(authentication.getName(), request);
    return ResponseEntity.ok("비밀번호가 변경되었습니다.");
  }

  @Operation(summary = "이메일 중복 확인", description = "입력한 이메일의 중복 여부를 확인합니다.")
  @ApiResponse(responseCode = "200", description = "사용 가능한 이메일")
  @ApiResponse(responseCode = "400", description = "이미 존재하는 이메일")
  @RateLimit(maxAttempts = 20, windowSeconds = 60)
  @GetMapping("/check-email")
  public ResponseEntity<String> checkEmail(@RequestParam String email) {
    authService.checkEmailDuplicate(email);
    return ResponseEntity.ok("사용 가능한 이메일입니다.");
  }

  @Operation(summary = "닉네임 중복 확인", description = "입력한 닉네임의 중복 여부를 확인합니다.")
  @ApiResponse(responseCode = "200", description = "사용 가능한 닉네임")
  @ApiResponse(responseCode = "400", description = "이미 존재하는 닉네임")
  @RateLimit(maxAttempts = 20, windowSeconds = 60)
  @GetMapping("/check-nickname")
  public ResponseEntity<String> checkNickname(@RequestParam String nickname) {
    authService.checkNicknameDuplicate(nickname);
    return ResponseEntity.ok("사용 가능한 닉네임입니다.");
  }

  @Operation(summary = "회원가입", description = "아이디, 비밀번호, 닉네임을 입력받아 신규 회원을 등록합니다.")
  @ApiResponse(responseCode = "200", description = "회원가입 성공")
  @ApiResponse(responseCode = "400", description = "잘못된 입력값 또는 중복된 아이디/닉네임")
  @RateLimit(maxAttempts = 200, windowSeconds = 600)
  @PostMapping("/signup")
  public ResponseEntity<String> signUp(@Valid @RequestBody SignUpRequest request) {
    authService.signUp(request);
    return ResponseEntity.ok("회원가입이 완료되었습니다.");
  }

  @Operation(summary = "로그인", description = "아이디와 비밀번호를 검증하여 JWT 토큰을 발급합니다.")
  @ApiResponse(responseCode = "200", description = "로그인 성공 및 토큰 발급")
  @ApiResponse(responseCode = "401", description = "인증 실패")
  @RateLimit(maxAttempts = 200, windowSeconds = 300)
  @PostMapping("/login")
  public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
    TokenResponse response = authService.login(request);
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "소셜 회원가입 완료", description = "소셜 인증 후 닉네임을 설정하여 가입을 완료합니다.")
  @ApiResponse(responseCode = "200", description = "가입 성공 및 토큰 발급")
  @ApiResponse(responseCode = "400", description = "중복된 닉네임 또는 유효하지 않은 토큰")
  @PostMapping("/social/signup")
  public ResponseEntity<TokenResponse> socialSignUp(
      @Valid @RequestBody SocialSignUpRequest request) {
    TokenResponse response = authService.socialSignUp(request);
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "아이디 찾기", description = "닉네임을 입력받아 마스킹된 아이디(이메일)를 반환합니다.")
  @ApiResponse(responseCode = "200", description = "아이디 조회 성공")
  @ApiResponse(responseCode = "404", description = "존재하지 않는 사용자")
  @GetMapping("/find-id")
  public ResponseEntity<String> findId(@RequestParam String nickname) {
    String foundEmail = authService.findIdByNickname(nickname);
    return ResponseEntity.ok(foundEmail);
  }

  @Operation(summary = "OAuth2 코드 교환", description = "OAuth2 로그인 후 전달받은 임시 코드를 JWT 토큰으로 교환합니다.")
  @ApiResponse(responseCode = "200", description = "교환 성공")
  @ApiResponse(responseCode = "400", description = "유효하지 않은 코드")
  @PostMapping("/exchange-code")
  public ResponseEntity<TokenResponse> exchangeCode(
      @RequestBody java.util.Map<String, String> request) {
    String code = request.get("code");
    TokenResponse response = authService.exchangeCode(code);
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "토큰 재발급", description = "리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.")
  @ApiResponse(responseCode = "200", description = "재발급 성공")
  @ApiResponse(responseCode = "400", description = "유효하지 않은 리프레시 토큰")
  @PostMapping("/refresh")
  public ResponseEntity<TokenResponse> refresh(@RequestParam String refreshToken) {
    TokenResponse response = authService.refresh(refreshToken);
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "로그아웃", description = "현재 로그아웃 처리를 수행합니다. (서버 측 토큰 무효화 준비)")
  @ApiResponse(responseCode = "200", description = "로그아웃 성공")
  @PostMapping("/logout")
  public ResponseEntity<String> logout(HttpServletRequest request, Authentication authentication) {
    String authHeader = request.getHeader("Authorization");
    String accessToken = null;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7);
    }
    authService.logout(authentication.getName(), accessToken);
    return ResponseEntity.ok("로그아웃되었습니다.");
  }

  @Operation(summary = "회원 탈퇴", description = "사용자의 모든 데이터를 삭제하고 탈퇴 처리를 수행합니다.")
  @ApiResponse(responseCode = "200", description = "탈퇴 성공")
  @ApiResponse(responseCode = "400", description = "비밀번호 불일치")
  @DeleteMapping("/me")
  public ResponseEntity<String> withdraw(
      Authentication authentication, @RequestParam(required = false) String password) {
    authService.withdraw(authentication.getName(), password);
    return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
  }

  @Operation(summary = "비밀번호 재설정", description = "이메일을 입력받아 해당 이메일로 임시 비밀번호를 발송합니다.")
  @ApiResponse(responseCode = "200", description = "임시 비밀번호 발송 성공")
  @ApiResponse(responseCode = "404", description = "존재하지 않는 사용자")
  @PostMapping("/password/reset")
  public ResponseEntity<String> resetPassword(@RequestParam String email) {
    authService.resetPassword(email);
    return ResponseEntity.ok("임시 비밀번호가 이메일로 발송되었습니다.");
  }
}
