package com.daypoo.api.global.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@EnableJpaAuditing
@Configuration
public class AppConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /**
   * 서버 기동 직후 BCrypt JVM 워밍업. t2.micro 환경에서 첫 번째 passwordEncoder.matches() 호출 시 JIT 컴파일이 되지 않아 수 초간
   * 지연되는 현상을 방지한다.
   */
  @EventListener(ApplicationReadyEvent.class)
  public void warmUpBCrypt() {
    log.info("[BCrypt] JVM warm-up 시작...");
    long start = System.currentTimeMillis();
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    encoder.matches("warmup", encoder.encode("warmup"));
    log.info("[BCrypt] JVM warm-up 완료 ({}ms)", System.currentTimeMillis() - start);
  }
}
