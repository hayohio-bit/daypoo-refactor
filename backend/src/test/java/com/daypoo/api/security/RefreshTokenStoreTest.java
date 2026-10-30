package com.daypoo.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
@DisplayName("리프레시 토큰 저장소 테스트")
class RefreshTokenStoreTest {

  @InjectMocks private RefreshTokenStore store;

  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ValueOperations<String, String> valueOperations;
  @Mock private JwtProvider jwtProvider;

  @BeforeEach
  void setUp() {
    lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
  }

  @Test
  @DisplayName("저장: 토큰의 남은 유효 시간을 TTL 로 삼아 refresh_token:{email} 키에 넣는다")
  void save_storesWithRemainingTtl() {
    given(jwtProvider.getRemainingTime("rt")).willReturn(5_000L);

    store.save("user@example.com", "rt");

    verify(valueOperations)
        .set("refresh_token:user@example.com", "rt", 5_000L, TimeUnit.MILLISECONDS);
  }

  @Test
  @DisplayName("저장: 이미 만료된 토큰은 저장하지 않는다")
  void save_skipsExpiredToken() {
    given(jwtProvider.getRemainingTime("rt")).willReturn(0L);

    store.save("user@example.com", "rt");

    verify(valueOperations, never())
        .set(anyString(), anyString(), anyLong(), org.mockito.ArgumentMatchers.any(TimeUnit.class));
  }

  @Test
  @DisplayName("비교: 저장된 토큰과 같을 때만 true")
  void matches_onlyWhenStoredTokenEquals() {
    given(valueOperations.get("refresh_token:user@example.com")).willReturn("rt");

    assertThat(store.matches("user@example.com", "rt")).isTrue();
    assertThat(store.matches("user@example.com", "other")).isFalse();
  }

  @Test
  @DisplayName("비교: 저장된 토큰이 없으면 false")
  void matches_falseWhenNothingStored() {
    given(valueOperations.get("refresh_token:user@example.com")).willReturn(null);

    assertThat(store.matches("user@example.com", "rt")).isFalse();
  }

  @Test
  @DisplayName("삭제: refresh_token:{email} 키를 지운다")
  void delete_removesKey() {
    store.delete("user@example.com");

    verify(redisTemplate).delete("refresh_token:user@example.com");
  }
}
