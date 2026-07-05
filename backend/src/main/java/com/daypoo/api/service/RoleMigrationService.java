package com.daypoo.api.service;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleMigrationService implements CommandLineRunner {

  private final UserRepository userRepository;

  @Override
  @Transactional
  public void run(String... args) throws Exception {
    migrateLegacyRoles();
  }

  /**
   * ROLE_PRO, ROLE_PREMIUM 역할을 가진 유저들을 ROLE_USER로 일괄 마이그레이션합니다. 구독 정보는 이미 subscriptions 테이블에 존재하므로
   * role만 물리적으로 복구합니다.
   */
  public void migrateLegacyRoles() {
    log.info("Starting role migration: Moving ROLE_PRO/PREMIUM to ROLE_USER...");

    List<Role> targetRoles = List.of(Role.ROLE_PRO, Role.ROLE_PREMIUM);
    List<User> legacyUsers =
        userRepository.findAll().stream().filter(u -> targetRoles.contains(u.getRole())).toList();

    if (legacyUsers.isEmpty()) {
      log.info("No legacy roles found. Migration skipped.");
      return;
    }

    log.info("Found {} users with legacy roles. Migrating...", legacyUsers.size());

    for (User user : legacyUsers) {
      log.info("Migrating user: {} ({} -> ROLE_USER)", user.getEmail(), user.getRole());
      user.updateRole(Role.ROLE_USER);
    }

    userRepository.saveAll(legacyUsers);
    log.info("✅ Successfully migrated {} users to ROLE_USER.", legacyUsers.size());
  }
}
