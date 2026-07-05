package com.daypoo.api.service;

import com.daypoo.api.dto.LoginRequest;
import com.daypoo.api.dto.PasswordChangeRequest;
import com.daypoo.api.dto.ProfileUpdateRequest;
import com.daypoo.api.dto.SignUpRequest;
import com.daypoo.api.dto.SocialSignUpRequest;
import com.daypoo.api.dto.TokenResponse;
import com.daypoo.api.dto.UserResponse;
import com.daypoo.api.entity.Inventory;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ItemType;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.*;
import com.daypoo.api.security.JwtProvider;
import io.jsonwebtoken.Claims;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtProvider jwtProvider;
  private final EmailService emailService;
  private final StringRedisTemplate redisTemplate;
  private final TitleRepository titleRepository;
  private final UserDeletionService userDeletionService;
  private final PooRecordRepository pooRecordRepository;
  private final SystemLogService systemLogService;
  private final InventoryRepository inventoryRepository;
  private final ItemRepository itemRepository;
  private final AdminSettingsService adminSettingsService;

  @Transactional
  public TokenResponse socialSignUp(SocialSignUpRequest request) {
    if (!adminSettingsService.isSignupEnabled()) {
      throw new BusinessException(ErrorCode.SIGNUP_DISABLED);
    }
    if (!jwtProvider.validateToken(request.registrationToken())) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    Claims claims = jwtProvider.getClaims(request.registrationToken());
    String type = claims.get("type", String.class);
    if (!"registration".equals(type)) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    String email = claims.get("email", String.class);
    String roleClaim = claims.get("role", String.class);

    checkNicknameDuplicate(request.nickname());

    // 중복 가입 방지
    if (userRepository.existsByEmail(email)) {
      throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    User user =
        User.builder()
            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
            .email(email)
            .nickname(request.nickname())
            .role(Role.valueOf(roleClaim))
            .build();

    userRepository.save(user);
    assignDefaultAvatar(user);
    systemLogService.info("Auth", "Social user registered: " + email);

    String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name());
    String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

    return TokenResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
  }

  @Transactional(readOnly = true)
  public UserResponse getCurrentUserInfo() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    String titleName = null;
    Long equippedTitleId = user.getEquippedTitleId();
    if (equippedTitleId != null) {
      titleName =
          titleRepository
              .findById(equippedTitleId)
              .map(com.daypoo.api.entity.Title::getName)
              .orElse(null);
    }

    // Calculate statistics
    Long totalAuthCount = pooRecordRepository.countByUser(user);

    // M7 최적화: N+1 문제 해결을 위해 DISTINCT COUNT 쿼리 사용
    Long totalVisitCount = pooRecordRepository.countDistinctToiletsByUser(user);

    // Calculate consecutive days - streaks are still calculated from records,
    // but we limit it to recent records for efficiency if needed.
    // For now, keeping the logic but using a more efficient query if possible.
    List<com.daypoo.api.entity.PooRecord> records =
        pooRecordRepository
            .findByUserOrderByCreatedAtDesc(
                user, org.springframework.data.domain.PageRequest.of(0, 100))
            .getContent();

    Integer consecutiveDays = 0;
    if (!records.isEmpty()) {
      int streak = 1;
      java.time.LocalDate lastDate = records.get(0).getCreatedAt().toLocalDate();

      for (int i = 1; i < records.size(); i++) {
        java.time.LocalDate currentDate = records.get(i).getCreatedAt().toLocalDate();
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(currentDate, lastDate);

        if (daysDiff == 1) {
          streak++;
          lastDate = currentDate;
        } else if (daysDiff > 1) {
          break;
        }
      }
      consecutiveDays = streak;
    }

    // 장착된 아바타 아이템 조회
    String equippedAvatarUrl =
        inventoryRepository
            .findAllByUserAndIsEquippedTrueAndItemType(user, ItemType.AVATAR)
            .stream()
            .findFirst()
            .map(Inventory::getItem)
            .map(com.daypoo.api.entity.Item::getImageUrl)
            .orElse(null);

    return UserResponse.from(
        user,
        titleName,
        user.getActiveSubscription(),
        totalAuthCount,
        totalVisitCount,
        consecutiveDays,
        equippedAvatarUrl);
  }

  @Transactional
  public TokenResponse exchangeCode(String code) {
    String redisKey = "auth_code:" + code;
    String value = redisTemplate.opsForValue().get(redisKey);

    if (value == null) {
      log.warn("Invalid or expired auth code: {}", code);
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    // 일회용이므로 즉시 삭제
    redisTemplate.delete(redisKey);

    String[] tokens = value.split(":");
    if (tokens.length != 2) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    log.info("Auth code {} successfully exchanged for tokens", code);
    return TokenResponse.builder().accessToken(tokens[0]).refreshToken(tokens[1]).build();
  }

  @Transactional
  public void signUp(SignUpRequest request) {
    if (!adminSettingsService.isSignupEnabled()) {
      throw new BusinessException(ErrorCode.SIGNUP_DISABLED);
    }
    checkEmailDuplicate(request.email());
    checkNicknameDuplicate(request.nickname());

    User user =
        User.builder()
            .password(passwordEncoder.encode(request.password()))
            .email(request.email())
            .nickname(request.nickname())
            .role(Role.ROLE_USER)
            .build();

    userRepository.save(user);
    assignDefaultAvatar(user);
    systemLogService.info("Auth", "New user registered: " + request.email());
  }

  private void assignDefaultAvatar(User user) {
    Long defaultItemId = adminSettingsService.getDefaultAvatarItemId();
    if (defaultItemId == null) {
      return;
    }
    itemRepository
        .findById(defaultItemId)
        .ifPresent(
            item -> {
              Inventory inventory =
                  Inventory.builder().user(user).item(item).isEquipped(true).build();
              inventoryRepository.save(inventory);
            });
  }

  public String findIdByNickname(String nickname) {
    User user =
        userRepository
            .findByNickname(nickname)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    // 이메일 마스킹 (he***@example.com 형태)
    String email = user.getEmail();
    int atIndex = email.indexOf("@");
    if (atIndex <= 2) return email;

    return email.substring(0, 2) + "***" + email.substring(atIndex);
  }

  public void checkEmailDuplicate(String email) {
    if (userRepository.existsByEmail(email)) {
      throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
  }

  public void checkNicknameDuplicate(String nickname) {
    if (userRepository.existsByNickname(nickname)) {
      throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
    }
  }

  @Transactional
  public TokenResponse login(LoginRequest request) {
    log.debug("[Auth] login attempt: email={}", request.email());

    User user =
        userRepository
            .findByEmail(request.email())
            .orElseThrow(
                () -> {
                  log.debug("[Auth] login failed - user not found: email={}", request.email());
                  return new BusinessException(ErrorCode.USER_NOT_FOUND);
                });

    log.debug("[Auth] BCrypt.matches() 시작: email={}", request.email());
    long bcryptStart = System.currentTimeMillis();
    boolean passwordMatch;
    try {
      passwordMatch = passwordEncoder.matches(request.password(), user.getPassword());
    } catch (Exception e) {
      log.error(
          "[Auth] BCrypt.matches() 예외 발생: email={}, error={}", request.email(), e.getMessage(), e);
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }
    log.debug(
        "[Auth] BCrypt.matches() 완료: email={}, matched={}, elapsed={}ms",
        request.email(),
        passwordMatch,
        System.currentTimeMillis() - bcryptStart);

    if (!passwordMatch) {
      log.debug("[Auth] login failed - password mismatch: email={}", request.email());
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }

    String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name());
    String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

    systemLogService.info("Auth", "User login: " + user.getEmail());
    return TokenResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
  }

  @Transactional
  public void resetPassword(String email) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    // 1. 임시 비밀번호 생성 (8자리)
    String tempPassword = UUID.randomUUID().toString().substring(0, 8);

    // 2. 사용자 비밀번호 업데이트
    user.updatePassword(passwordEncoder.encode(tempPassword));

    // 3. 이메일 발송
    String subject = "[Day Poo] 임시 비밀번호 안내";
    String text =
        String.format(
            "안녕하세요, Day Poo입니다.\n\n"
                + "요청하신 임시 비밀번호를 안내해 드립니다.\n"
                + "임시 비밀번호: %s\n\n"
                + "로그인 후 반드시 비밀번호를 변경해 주세요.",
            tempPassword);

    emailService.sendEmail(user.getEmail(), subject, text);
  }

  @Transactional
  public void updateProfile(String email, ProfileUpdateRequest request) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    // 닉네임이 현재와 다를 경우만 중복 체크
    if (!user.getNickname().equals(request.nickname())) {
      checkNicknameDuplicate(request.nickname());
      user.updateNickname(request.nickname());
    }
  }

  @Transactional
  public void changePassword(String email, PasswordChangeRequest request) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }

    user.updatePassword(passwordEncoder.encode(request.newPassword()));
  }

  @Transactional(readOnly = true)
  public TokenResponse refresh(String refreshToken) {
    if (!jwtProvider.validateToken(refreshToken)) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN);
    }

    Claims claims = jwtProvider.getClaims(refreshToken);
    String email = claims.getSubject();

    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    String newAccessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name());

    return TokenResponse.builder().accessToken(newAccessToken).refreshToken(refreshToken).build();
  }

  @Transactional
  public void logout(String email, String accessToken) {
    if (accessToken != null) {
      long remainingTime = jwtProvider.getRemainingTime(accessToken);
      if (remainingTime > 0) {
        redisTemplate
            .opsForValue()
            .set("blacklist:" + accessToken, "logout", remainingTime, TimeUnit.MILLISECONDS);
      }
    }
    systemLogService.info("Auth", "User logout: " + email);
    log.info("User {} logged out and token blacklisted", email);
  }

  @Transactional
  public void withdraw(String email, String password) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    if (user.getPassword() != null
        && password != null
        && !passwordEncoder.matches(password, user.getPassword())) {
      throw new BusinessException(ErrorCode.INVALID_PASSWORD);
    }

    // 연관 데이터 통합 삭제 서비스 호출
    userDeletionService.deleteUserAndRelatedData(user);
    systemLogService.info("Auth", "User withdrawn: " + email);
    log.info("User {} successfully withdrawn", email);
  }
}
