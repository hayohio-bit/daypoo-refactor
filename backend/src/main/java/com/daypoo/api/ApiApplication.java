package com.daypoo.api;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
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
}
