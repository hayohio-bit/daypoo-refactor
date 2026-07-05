package com.daypoo.api.simulation.bot.scenario;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.ToiletReview;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.ToiletReviewRepository;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.RankingService;
import com.daypoo.api.simulation.bot.BotUserPool;
import com.daypoo.api.simulation.seeder.SeedDataGenerator;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile("simulation")
@RequiredArgsConstructor
public class ExplorerScenario implements BotScenario {

  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;
  private final ToiletReviewRepository reviewRepository;
  private final RankingService rankingService;
  private final BotUserPool userPool;
  private final Random random = new Random();

  @Override
  @Transactional
  public void execute(Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return;

    // Simulate searching toilets near random coordinates
    toiletRepository.findToiletsWithinRadius(
        37.5 + random.nextDouble() * 0.1, 127.0 + random.nextDouble() * 0.1, 1000, 10);

    Long toiletId = userPool.getRandomToiletId();
    if (toiletId == null) return;
    Toilet toilet = toiletRepository.findById(toiletId).orElse(null);
    if (toilet == null) return;

    ToiletReview review =
        ToiletReview.builder()
            .user(user)
            .toilet(toilet)
            .rating(1 + random.nextInt(5))
            .emojiTags("탐험가봇,👍")
            .comment(SeedDataGenerator.generateRandomReviewComment())
            .build();
    reviewRepository.save(review);

    rankingService.getGlobalRanking();

    log.debug("Bot {} executed Explorer at toilet {}", user.getEmail(), toiletId);
  }
}
