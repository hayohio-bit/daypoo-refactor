package com.daypoo.api.global.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class ServiceLoggingAspect {

  @Around("execution(* com.daypoo.api.service.*.*(..))")
  public Object logServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
    String method = joinPoint.getSignature().toShortString();
    log.debug("[SERVICE] Start: {}", method);
    long start = System.currentTimeMillis();
    try {
      Object result = joinPoint.proceed();
      log.debug("[SERVICE] End: {} ({}ms)", method, System.currentTimeMillis() - start);
      return result;
    } catch (Exception e) {
      log.error("[SERVICE] Error: {} - {}", method, e.getMessage());
      throw e;
    }
  }
}
