package com.daypoo.api.global.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
  int maxAttempts() default 5;

  int windowSeconds() default 300;

  /**
   * true 이면 로그인한 사용자 기준으로 센다(인증 정보가 없으면 IP). 이동통신사 공유 IP 뒤의 정상 사용자끼리 한도를 나눠 쓰지 않아야 하는 인증된 API 에 쓴다.
   */
  boolean perUser() default false;
}
