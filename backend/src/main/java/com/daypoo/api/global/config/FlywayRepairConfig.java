package com.daypoo.api.global.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class FlywayRepairConfig {

  @Bean
  public FlywayMigrationStrategy flywayMigrationStrategy(
      @Value("${flyway.repair-on-start:false}") boolean repairOnStart) {
    return flyway -> {
      if (repairOnStart) {
        log.info("🔧 [Flyway] Running repair (flyway.repair-on-start=true)...");
        flyway.repair();
      }
      flyway.migrate();
    };
  }
}
