package com.daypoo.api;

import com.daypoo.api.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@Slf4j
@EnableAsync
@EnableScheduling
@SpringBootApplication
public class ApiApplication {
  @jakarta.annotation.PostConstruct
  public void init() {
    java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Seoul"));
    log.info(
        "⏰ [Time-Check] System timezone set to Asia/Seoul. Current time: {}",
        java.time.LocalDateTime.now());
  }

  public static void main(String[] args) {
    SpringApplication.run(ApiApplication.class, args);
  }

  @Bean
  @Order(3)
  public CommandLineRunner runSelfCheck(
      EmailService emailService,
      @Value("${spring.mail.username:NOT_FOUND}") String mailUser,
      @Value("${spring.mail.password:NOT_FOUND}") String mailPass,
      @Value("${toss.secret-key:NOT_FOUND}") String tossKey,
      @Value("${app.self-check.mail-enabled:false}") boolean mailEnabled) {
    return args -> {
      log.info("🔍 [Env-Check] MAIL_USERNAME: {}", mask(mailUser));
      log.info("🔍 [Env-Check] MAIL_PASSWORD: {}", mask(mailPass));
      log.info("🔍 [Env-Check] TOSS_SECRET_KEY: {}", mask(tossKey));

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
