package com.daypoo.api.simulation.bot.scenario;

import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.RankingService;
import com.daypoo.api.service.TitleAchievementService;
import com.daypoo.api.simulation.bot.BotUserPool;
import com.daypoo.api.simulation.seeder.SeedDataGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile("simulation")
@RequiredArgsConstructor
public class MorningRoutineScenario implements BotScenario {

  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;
  private final PooRecordRepository recordRepository;
  private final RankingService rankingService;
  private final TitleAchievementService titleAchievementService;
  private final BotUserPool userPool;

  @Override
  @Transactional
  public void execute(Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return;

    Long toiletId = userPool.getRandomToiletId();
    if (toiletId == null) return;

    Toilet toilet = toiletRepository.findById(toiletId).orElse(null);
    if (toilet == null) return;

    String region = SeedDataGenerator.generateRandomRegion();

    PooRecord record =
        PooRecord.builder()
            .user(user)
            .toilet(toilet)
            .bristolScale(SeedDataGenerator.generateRandomBristolScale())
            .color(SeedDataGenerator.generateRandomColor())
            .conditionTags(SeedDataGenerator.generateRandomConditionTags())
            .dietTags(SeedDataGenerator.generateRandomDietTags())
            .regionName(region)
            .build();

    recordRepository.save(record);

    user.addExpAndPoints(10, 5);
    rankingService.updateGlobalRank(user);
    rankingService.updateRegionRank(user, region);
    titleAchievementService.checkAndGrantTitles(user);

    log.debug("Bot {} executed MorningRoutine at toilet {}", user.getEmail(), toiletId);
  }
}
