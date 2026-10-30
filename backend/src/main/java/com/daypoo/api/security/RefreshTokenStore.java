package com.daypoo.api.security;

import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/** 사용자별 리프레시 토큰을 Redis 에 보관한다. 일반 로그인·소셜 로그인·소셜 가입이 같은 키와 TTL 규칙을 쓰도록 저장 지점을 한 곳에 모은다. */
@Component
@RequiredArgsConstructor
public class RefreshTokenStore {

  static final String KEY_PREFIX = "refresh_token:";

  private final StringRedisTemplate redisTemplate;
  private final JwtProvider jwtProvider;

  /** 토큰의 남은 유효 시간을 TTL 로 삼아 저장한다. 이미 만료된 토큰은 저장하지 않는다. */
  public void save(String email, String refreshToken) {
    long remainingTime = jwtProvider.getRemainingTime(refreshToken);
    if (remainingTime > 0) {
      redisTemplate
          .opsForValue()
          .set(KEY_PREFIX + email, refreshToken, remainingTime, TimeUnit.MILLISECONDS);
    }
  }

  /** 저장된 토큰이 있고 요청 토큰과 같을 때만 true. */
  public boolean matches(String email, String refreshToken) {
    String storedToken = redisTemplate.opsForValue().get(KEY_PREFIX + email);
    return storedToken != null && storedToken.equals(refreshToken);
  }

  public void delete(String email) {
    redisTemplate.delete(KEY_PREFIX + email);
  }
}
