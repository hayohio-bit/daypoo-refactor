package com.daypoo.api.simulation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "simulation")
public class SimulationProperties {
  private boolean enabled = false;
  private int batchSize = 1000;
  private int userCount = 10000;
  private int recordCount = 50000;
  private int reviewCount = 20000;
  private BotCount bot = new BotCount();

  @Getter
  @Setter
  public static class BotCount {
    private int morningRoutine = 50;
    private int explorer = 20;
    private int shopper = 10;
    private int support = 5;
    private int social = 33;
  }
}
