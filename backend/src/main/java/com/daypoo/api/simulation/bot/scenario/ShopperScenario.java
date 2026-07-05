package com.daypoo.api.simulation.bot.scenario;

import com.daypoo.api.dto.ItemResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.ShopService;
import java.util.List;
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
public class ShopperScenario implements BotScenario {

  private final UserRepository userRepository;
  private final ShopService shopService;
  private final Random random = new Random();

  @Override
  @Transactional
  public void execute(Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return;

    // Ensure user has points (free points for bots!)
    if (user.getPoints() < 1000) {
      user.addExpAndPoints(0, 5000);
      userRepository.save(user);
    }

    List<ItemResponse> items = shopService.getAllItems(user, null);
    if (items.isEmpty()) return;

    ItemResponse item = items.get(random.nextInt(items.size()));

    try {
      shopService.purchaseItem(user, item.id());
      log.debug("Bot {} purchased item {}", user.getEmail(), item.name());
    } catch (Exception e) {
      // Already owned or other error, ignore
    }

    log.debug("Bot {} executed Shopper", user.getEmail());
  }
}
