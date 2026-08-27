package com.daypoo.api.global.config;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${app.admin.email}")
  private String adminEmail;

  @Value("${app.admin.password}")
  private String adminPassword;

  @Override
  public void run(String... args) {
    try {
      log.info("🏁 DataInitializer started...");
      initializeAdmin();
      log.info("✅ DataInitializer completed.");
    } catch (Exception e) {
      log.error("❌ DataInitializer failed: {}. Server will continue to start.", e.getMessage(), e);
    }
  }

  private void initializeAdmin() {
    userRepository
        .findByEmail(adminEmail)
        .ifPresentOrElse(
            existingAdmin -> {
              if (existingAdmin.getRole() != Role.ROLE_ADMIN) {
                existingAdmin.updateRole(Role.ROLE_ADMIN);
                userRepository.save(existingAdmin);
              }
            },
            () -> {
              if (adminPassword == null || adminPassword.isBlank()) {
                log.warn(
                    "⚠️ ADMIN_PASSWORD가 설정되지 않아 관리자 계정을 생성하지 않습니다. "
                        + "관리자 계정이 필요하면 환경 변수 ADMIN_PASSWORD를 설정하세요.");
                return;
              }
              userRepository.save(
                  User.builder()
                      .password(passwordEncoder.encode(adminPassword))
                      .nickname("관리자")
                      .email(adminEmail)
                      .role(Role.ROLE_ADMIN)
                      .build());
            });
  }
}
