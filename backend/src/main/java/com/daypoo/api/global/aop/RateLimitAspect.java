package com.daypoo.api.global.aop;

import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

  private final StringRedisTemplate redisTemplate;

  @Around("@annotation(rateLimit)")
  public Object checkRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit)
      throws Throwable {
    String key = resolveKey(joinPoint, rateLimit);
    Long count = redisTemplate.opsForValue().increment("rate:" + key);

    if (count != null && count > rateLimit.maxAttempts()) {
      // 429 Too Many Requests -> BusinessException 체계 활용 (사용자 정의 ErrorCode 필요 가능성)
      throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS);
    }
    if (count != null && count == 1) {
      redisTemplate.expire("rate:" + key, rateLimit.windowSeconds(), TimeUnit.SECONDS);
    }
    return joinPoint.proceed();
  }

  private String resolveKey(ProceedingJoinPoint joinPoint, RateLimit rateLimit) {
    HttpServletRequest request =
        ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    String ip = resolveClientIp(request);
    String method = joinPoint.getSignature().toShortString();
    return ip + ":" + method;
  }

  /**
   * CloudFront / Nginx 등 리버스 프록시 환경에서 실제 클라이언트 IP를 추출한다. CloudFront-Viewer-Address 헤더가 존재하면 이를 우선
   * 사용하고(변조 어려움), 그 외에는 Spring의 forward-headers-strategy: native 설정에 의해 신뢰하는 프록시로부터 전달된
   * getRemoteAddr()을 사용한다.
   */
  private String resolveClientIp(HttpServletRequest request) {
    // CloudFront 전용 헤더 (IP:Port 형식)
    String cfAddress = request.getHeader("CloudFront-Viewer-Address");
    if (cfAddress != null && !cfAddress.isBlank()) {
      return cfAddress.split(":")[0];
    }

    // Spring forward-headers-strategy: native 설정이 되어 있다면
    // getRemoteAddr()은 이미 실제 클라이언트 IP를 반환함
    return request.getRemoteAddr();
  }
}
