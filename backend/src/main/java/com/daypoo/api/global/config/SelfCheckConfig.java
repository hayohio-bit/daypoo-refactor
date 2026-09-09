package com.daypoo.api.global.config;

import com.daypoo.api.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

/**
 * 기동 직후 메일 환경 변수가 실제로 주입되었는지 확인하는 자가 진단 러너다.
 *
 * <p>메인 클래스 {@code ApiApplication} 에 두지 않는 이유는 슬라이스 테스트 때문이다. 메인 클래스의 {@code @Bean} 메서드는 진입 설정이라
 * {@code @DataJpaTest} 같은 슬라이스에서도 항상 로딩되는데, 그 슬라이스는 {@code EmailService} 를 빈으로 만들지 않아 컨텍스트 구성이
 * 실패한다.
 */
@Slf4j
@Configuration
public class SelfCheckConfig {

  @Bean
  @Order(3)
  public CommandLineRunner runSelfCheck(
      EmailService emailService,
      @Value("${spring.mail.username:NOT_FOUND}") String mailUser,
      @Value("${spring.mail.password:NOT_FOUND}") String mailPass,
      @Value("${app.self-check.mail-enabled:false}") boolean mailEnabled) {
    return args -> {
      log.info("🔍 [Env-Check] MAIL_USERNAME: {}", mask(mailUser));
      log.info("🔍 [Env-Check] MAIL_PASSWORD: {}", mask(mailPass));

      if (!mailEnabled) {
        log.info("ℹ️ [Self-Check] Mail self-check disabled (app.self-check.mail-enabled=false).");
        return;
      }

      if ("NOT_FOUND".equals(mailUser) || mailUser.isEmpty()) {
        log.warn("⚠️ Warning: .env variables [MAIL_USERNAME] are NOT loaded. Skipping mail test.");
        return;
      }

      // 메일 발송만 비동기로 실행
      java.util.concurrent.CompletableFuture.runAsync(
          () -> {
            try {
              emailService.sendEmail(
                  mailUser,
                  "[Day Poo] 자가 진단 메일",
                  "백엔드 서버가 시작되었습니다.\n\n발송 시각: " + java.time.LocalDateTime.now());
              log.info("✅ Self-check mail sent successfully.");
            } catch (Exception e) {
              log.warn(
                  "⚠️ Self-check mail failed: {}. Server will continue to run.", e.getMessage());
            }
          });
    };
  }

  private String mask(String value) {
    if (value == null || value.length() < 4) return "****";
    return value.substring(0, 2) + "****" + value.substring(value.length() - 2);
  }
}
