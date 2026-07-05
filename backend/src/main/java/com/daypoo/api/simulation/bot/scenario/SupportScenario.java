package com.daypoo.api.simulation.bot.scenario;

import com.daypoo.api.entity.Inquiry;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.InquiryType;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.UserRepository;
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
public class SupportScenario implements BotScenario {

  private final UserRepository userRepository;
  private final InquiryRepository inquiryRepository;
  private final Random random = new Random();

  @Override
  @Transactional
  public void execute(Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return;

    Inquiry inquiry =
        Inquiry.builder()
            .user(user)
            .title("테스트 문의 - " + random.nextInt(1000))
            .content("봇 시뮬레이션 중 생성된 문의 내용입니다.")
            .type(InquiryType.OTHERS)
            .build();
    inquiryRepository.save(inquiry);

    log.debug("Bot {} executed Support - Inquiry created", user.getEmail());
  }
}
