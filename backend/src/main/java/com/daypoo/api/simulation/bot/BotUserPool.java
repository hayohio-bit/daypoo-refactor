package com.daypoo.api.simulation.bot;

import java.util.List;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("simulation")
@RequiredArgsConstructor
public class BotUserPool {

  private final JdbcTemplate jdbcTemplate;
  private final Random random = new Random();

  private List<Long> userIds;
  private List<Long> toiletIds;

  public void refresh() {
    userIds =
        jdbcTemplate.queryForList(
            "SELECT id FROM users WHERE email LIKE 'bot%@daypoo.sim'", Long.class);
    toiletIds = jdbcTemplate.queryForList("SELECT id FROM toilets LIMIT 500", Long.class);
    log.info("BotUserPool refreshed: {} users, {} toilets", userIds.size(), toiletIds.size());
  }

  public Long getRandomUserId() {
    if (userIds == null || userIds.isEmpty()) return null;
    return userIds.get(random.nextInt(userIds.size()));
  }

  public Long getRandomToiletId() {
    if (toiletIds == null || toiletIds.isEmpty()) return null;
    return toiletIds.get(random.nextInt(toiletIds.size()));
  }

  public boolean isEmpty() {
    return userIds == null || userIds.isEmpty();
  }
}
