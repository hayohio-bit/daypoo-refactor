package com.daypoo.api.simulation.bot.scenario;

import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("simulation")
@RequiredArgsConstructor
public class ShopperScenario implements BotScenario {

  private final UserRepository userRepository;

  @Override
  public void execute(Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return;

    log.debug("Bot {} executed Shopper (Shop feature disabled)", user.getEmail());
  }
}
