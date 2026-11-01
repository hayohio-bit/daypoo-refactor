package com.daypoo.api.global.aop;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@DisplayName("속도 제한 애스펙트 테스트")
class RateLimitAspectTest {

  private final Map<String, Long> counters = new HashMap<>();
  private StringRedisTemplate redisTemplate;
  private RateLimitAspect aspect;
  private ProceedingJoinPoint joinPoint;

  @RateLimit(maxAttempts = 2, windowSeconds = 60, perUser = true)
  void perUserLimited() {}

  @RateLimit(maxAttempts = 2, windowSeconds = 60)
  void ipLimited() {}

  @SuppressWarnings("unchecked")
  @BeforeEach
  void setUp() throws Exception {
    redisTemplate = mock(StringRedisTemplate.class);
    ValueOperations<String, String> ops = mock(ValueOperations.class);
    given(redisTemplate.opsForValue()).willReturn(ops);
    given(ops.increment(anyString()))
        .willAnswer(inv -> counters.merge(inv.getArgument(0), 1L, Long::sum));
    aspect = new RateLimitAspect(redisTemplate);

    joinPoint = mock(ProceedingJoinPoint.class);
    Signature signature = mock(Signature.class);
    given(joinPoint.getSignature()).willReturn(signature);
    given(signature.toShortString()).willReturn("Controller.method(..)");

    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr("10.0.0.1");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
  }

  @AfterEach
  void tearDown() {
    RequestContextHolder.resetRequestAttributes();
    SecurityContextHolder.clearContext();
  }

  private RateLimit annotation(String methodName) throws Exception {
    return RateLimitAspectTest.class.getDeclaredMethod(methodName).getAnnotation(RateLimit.class);
  }

  private void loginAs(String email) {
    SecurityContextHolder.getContext()
        .setAuthentication(new UsernamePasswordAuthenticationToken(email, null, List.of()));
  }

  @Test
  @DisplayName("사용자별 제한: 같은 IP 의 다른 사용자는 한도를 따로 센다")
  void perUser_countsEachUserSeparately() throws Throwable {
    RateLimit limit = annotation("perUserLimited");

    loginAs("a@example.com");
    aspect.checkRateLimit(joinPoint, limit);
    aspect.checkRateLimit(joinPoint, limit);

    loginAs("B@Example.com");
    aspect.checkRateLimit(joinPoint, limit); // 같은 IP 라도 b 의 첫 호출이므로 통과

    // 키는 사용자 이름(소문자 정규화)을 포함하고 IP 는 포함하지 않는다
    assertThat(counters.keySet())
        .containsExactlyInAnyOrder(
            "rate:user:a@example.com:Controller.method(..)",
            "rate:user:b@example.com:Controller.method(..)");
  }

  @Test
  @DisplayName("첫 호출에서 윈도우 길이만큼 만료를 설정한다")
  void firstCall_setsExpiry() throws Throwable {
    aspect.checkRateLimit(joinPoint, annotation("ipLimited"));

    verify(redisTemplate)
        .expire("rate:10.0.0.1:Controller.method(..)", 60, java.util.concurrent.TimeUnit.SECONDS);
  }

  @Test
  @DisplayName("만료가 없는 채로 남은 키는 한도 초과 거절 시점에 만료를 다시 설정한다")
  void overLimit_healsKeyWithoutExpiry() throws Throwable {
    RateLimit limit = annotation("ipLimited");
    aspect.checkRateLimit(joinPoint, limit);
    aspect.checkRateLimit(joinPoint, limit);
    given(redisTemplate.getExpire("rate:10.0.0.1:Controller.method(..)")).willReturn(-1L);
    org.mockito.Mockito.clearInvocations(redisTemplate);

    assertThatThrownBy(() -> aspect.checkRateLimit(joinPoint, limit))
        .isInstanceOf(BusinessException.class);

    verify(redisTemplate)
        .expire("rate:10.0.0.1:Controller.method(..)", 60, java.util.concurrent.TimeUnit.SECONDS);
  }

  @Test
  @DisplayName("사용자별 제한: 한도를 넘으면 TOO_MANY_REQUESTS 이고 본 메서드는 호출되지 않는다")
  void perUser_overLimit_rejects() throws Throwable {
    RateLimit limit = annotation("perUserLimited");
    loginAs("a@example.com");
    aspect.checkRateLimit(joinPoint, limit);
    aspect.checkRateLimit(joinPoint, limit);

    assertThatThrownBy(() -> aspect.checkRateLimit(joinPoint, limit))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.TOO_MANY_REQUESTS);
    verify(joinPoint, times(2)).proceed();
  }

  @Test
  @DisplayName("사용자별 제한이어도 인증 정보가 없으면 IP 기준으로 센다")
  void perUser_withoutAuthentication_fallsBackToIp() throws Throwable {
    aspect.checkRateLimit(joinPoint, annotation("perUserLimited"));

    assertThat(counters.keySet()).containsExactly("rate:10.0.0.1:Controller.method(..)");
  }

  @Test
  @DisplayName("기본 제한은 로그인 여부와 무관하게 IP 기준으로 센다")
  void default_countsByIp() throws Throwable {
    RateLimit limit = annotation("ipLimited");
    loginAs("a@example.com");
    aspect.checkRateLimit(joinPoint, limit);
    loginAs("b@example.com");
    aspect.checkRateLimit(joinPoint, limit);

    assertThat(counters).hasSize(1).containsValue(2L);
  }
}
