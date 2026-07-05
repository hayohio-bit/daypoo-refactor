package com.daypoo.api.simulation.seeder;

import com.daypoo.api.simulation.bot.BotUserPool;
import com.daypoo.api.simulation.config.SimulationProperties;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(10)
@Profile("simulation")
@RequiredArgsConstructor
public class BulkDataSeeder implements CommandLineRunner {

  private final SimulationProperties properties;
  private final BulkInsertHelper insertHelper;
  private final JdbcTemplate jdbcTemplate;
  private final PasswordEncoder passwordEncoder;
  private final BotUserPool botUserPool;
  private final Random random = new Random();

  @Override
  public void run(String... args) {
    if (!properties.isEnabled()) {
      log.info("Simulation is disabled. Skipping seeding.");
      return;
    }

    Integer botUserCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE email LIKE 'bot%@daypoo.sim'", Integer.class);

    if (botUserCount != null && botUserCount > 0) {
      log.info("Bot users already exist (count: {}). Skipping bulk seeding.", botUserCount);
      return;
    }

    log.info("🚀 Starting Bulk Data Seeding (Async)...");
    CompletableFuture.runAsync(this::seedData);
  }

  private void seedData() {
    try {
      log.info("Phase 1: Seeding Users, Items, Titles, etc.");
      seedUsers();
      seedItemsAndTitles();

      List<Long> userIds =
          jdbcTemplate.queryForList(
              "SELECT id FROM users WHERE email LIKE 'bot%@daypoo.sim'", Long.class);
      List<Long> toiletIds =
          jdbcTemplate.queryForList("SELECT id FROM toilets LIMIT 100", Long.class);

      if (toiletIds.isEmpty()) {
        log.warn("No toilets found in DB. PooRecords seeding will likely fail or be empty.");
      }

      log.info("Phase 2: Seeding PooRecords and ToiletReviews");
      seedPooRecords(userIds, toiletIds);
      seedToiletReviews(userIds, toiletIds);

      log.info("Phase 3: Updating Toilet Statistics");
      insertHelper.updateToiletStats();

      log.info("Phase 4: Refreshing BotUserPool...");
      botUserPool.refresh();

      log.info("✅ Bulk Data Seeding Completed!");
    } catch (Exception e) {
      log.error("❌ Error during Bulk Data Seeding: ", e);
    }
  }

  private void seedUsers() {
    String botPass = passwordEncoder.encode("bot1234!");
    List<Object[]> users = new ArrayList<>();
    int count = properties.getUserCount();
    int batchSize = properties.getBatchSize();

    for (int i = 0; i < count; i++) {
      users.add(
          new Object[] {
            "bot" + i + "@daypoo.sim",
            botPass,
            SeedDataGenerator.generateRandomName() + "_" + i,
            1, // level
            0L, // exp
            0L, // points
            "ROLE_USER",
            Timestamp.valueOf(LocalDateTime.now()),
            Timestamp.valueOf(LocalDateTime.now())
          });

      if (users.size() >= batchSize) {
        insertHelper.bulkInsertUsers(users);
        users.clear();
        log.info("Seeded {} users...", i + 1);
      }
    }
    if (!users.isEmpty()) insertHelper.bulkInsertUsers(users);
  }

  private void seedItemsAndTitles() {
    List<Object[]> items = new ArrayList<>();
    items.add(
        new Object[] {
          "빛나는 똥",
          "최고의 명예",
          "AVATAR",
          1000L,
          null,
          Timestamp.valueOf(LocalDateTime.now()),
          Timestamp.valueOf(LocalDateTime.now())
        });
    items.add(
        new Object[] {
          "급한 휴지",
          "속도를 올린다",
          "EFFECT",
          200L,
          null,
          Timestamp.valueOf(LocalDateTime.now()),
          Timestamp.valueOf(LocalDateTime.now())
        });
    insertHelper.bulkInsertItems(items);

    List<Object[]> titles = new ArrayList<>();
    titles.add(
        new Object[] {
          "똥쟁이", "첫 기록 달성", "TOTAL_RECORDS", 1, Timestamp.valueOf(LocalDateTime.now())
        });
    titles.add(
        new Object[] {
          "변비 해결사", "기록 10회 달성", "TOTAL_RECORDS", 10, Timestamp.valueOf(LocalDateTime.now())
        });
    insertHelper.bulkInsertTitles(titles);
  }

  private void seedPooRecords(List<Long> userIds, List<Long> toiletIds) {
    if (toiletIds.isEmpty()) return;
    List<Object[]> records = new ArrayList<>();
    int count = properties.getRecordCount();
    int batchSize = properties.getBatchSize();

    for (int i = 0; i < count; i++) {
      records.add(
          new Object[] {
            userIds.get(random.nextInt(userIds.size())),
            toiletIds.get(random.nextInt(toiletIds.size())),
            SeedDataGenerator.generateRandomBristolScale(),
            SeedDataGenerator.generateRandomColor(),
            SeedDataGenerator.generateRandomConditionTags(),
            SeedDataGenerator.generateRandomDietTags(),
            SeedDataGenerator.generateRandomRegion(),
            Timestamp.valueOf(SeedDataGenerator.generateRandomDateTime(90))
          });

      if (records.size() >= batchSize) {
        insertHelper.bulkInsertPooRecords(records);
        records.clear();
      }
    }
    if (!records.isEmpty()) insertHelper.bulkInsertPooRecords(records);
  }

  private void seedToiletReviews(List<Long> userIds, List<Long> toiletIds) {
    if (toiletIds.isEmpty()) return;
    List<Object[]> reviews = new ArrayList<>();
    int count = properties.getReviewCount();
    int batchSize = properties.getBatchSize();

    for (int i = 0; i < count; i++) {
      LocalDateTime now = LocalDateTime.now();
      reviews.add(
          new Object[] {
            userIds.get(random.nextInt(userIds.size())),
            toiletIds.get(random.nextInt(toiletIds.size())),
            1 + random.nextInt(5),
            "😊,👍",
            SeedDataGenerator.generateRandomReviewComment(),
            Timestamp.valueOf(SeedDataGenerator.generateRandomDateTime(90)),
            Timestamp.valueOf(now)
          });

      if (reviews.size() >= batchSize) {
        insertHelper.bulkInsertToiletReviews(reviews);
        reviews.clear();
      }
    }
    if (!reviews.isEmpty()) insertHelper.bulkInsertToiletReviews(reviews);
  }
}
