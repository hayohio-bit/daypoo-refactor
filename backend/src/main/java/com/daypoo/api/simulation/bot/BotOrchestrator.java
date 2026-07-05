package com.daypoo.api.simulation.bot;

import com.daypoo.api.simulation.bot.scenario.*;
import com.daypoo.api.simulation.config.SimulationProperties;
import java.time.LocalTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("simulation")
@RequiredArgsConstructor
public class BotOrchestrator {

  private final SimulationProperties properties;
  private final BotUserPool userPool;

  private final MorningRoutineScenario morningScenario;
  private final ExplorerScenario explorerScenario;
  private final ShopperScenario shopperScenario;
  private final SupportScenario supportScenario;
  private final SocialScenario socialScenario;

  private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

  @Scheduled(fixedRate = 60000) // Every 1 minute
  public void runSimulationCycle() {
    if (!properties.isEnabled() || userPool.isEmpty()) {
      return;
    }

    LocalTime now = LocalTime.now();

    // Morning Routine (06:00 ~ 09:00, every 2 min -> approx 50 bots/cycle in morning)
    if (now.isAfter(LocalTime.of(6, 0)) && now.isBefore(LocalTime.of(9, 0))) {
      runBots(morningScenario, properties.getBot().getMorningRoutine());
    }

    // Explorer (10:00 ~ 22:00, every 5 min -> approx 20 bots/cycle)
    if (now.isAfter(LocalTime.of(10, 0)) && now.isBefore(LocalTime.of(22, 0))) {
      runBots(explorerScenario, properties.getBot().getExplorer());
    }

    // Shopper (All day, every 10 min -> approx 10 bots/cycle)
    if (now.getMinute() % 10 == 0) {
      runBots(shopperScenario, properties.getBot().getShopper());
    }

    // Support (Every 3 hours -> approx 5 bots/cycle)
    if (now.getHour() % 3 == 0 && now.getMinute() == 0) {
      runBots(supportScenario, properties.getBot().getSupport());
    }

    // Social (All day, every 3 min -> approx 33 bots/cycle)
    if (now.getMinute() % 3 == 0) {
      runBots(socialScenario, properties.getBot().getSocial());
    }
  }

  private void runBots(BotScenario scenario, int count) {
    log.info("🚀 Running scenario {} with {} bots", scenario.getClass().getSimpleName(), count);
    for (int i = 0; i < count; i++) {
      Long userId = userPool.getRandomUserId();
      if (userId != null) {
        executor.submit(
            () -> {
              try {
                scenario.execute(userId);
              } catch (Exception e) {
                log.error("Error executing bot scenario: ", e);
              }
            });
      }
    }
  }

  @Scheduled(fixedRate = 300000) // Refresh user pool every 5 minutes
  public void refreshPool() {
    if (properties.isEnabled()) {
      userPool.refresh();
    }
  }
}
