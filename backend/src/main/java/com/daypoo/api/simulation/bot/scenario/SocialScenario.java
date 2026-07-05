package com.daypoo.api.simulation.bot.scenario;

import com.daypoo.api.entity.User;
import com.daypoo.api.repository.NotificationRepository;
import com.daypoo.api.repository.ToiletReviewRepository;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.RankingService;
import com.daypoo.api.simulation.bot.BotUserPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile("simulation")
@RequiredArgsConstructor
public class SocialScenario implements BotScenario {

  private final UserRepository userRepository;
  private final NotificationRepository notificationRepository;
  private final ToiletReviewRepository reviewRepository;
  private final RankingService rankingService;
  private final BotUserPool userPool;

  @Override
  @Transactional(readOnly = true)
  public void execute(Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return;

    rankingService.getGlobalRanking();

    Long toiletId = userPool.getRandomToiletId();
    if (toiletId != null) {
      reviewRepository.findByToiletIdOrderByCreatedAtDesc(toiletId, PageRequest.of(0, 10));
    }

    notificationRepository.findAllByUserOrderByCreatedAtDesc(user);

    log.debug("Bot {} executed Social scenario (Read only)", user.getEmail());
  }
}
