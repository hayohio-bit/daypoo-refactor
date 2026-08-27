package com.daypoo.api.event;

import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class PooRecordEventListener {

  private final UserRepository userRepository;
  private final UserService userService;

  @Async("taskExecutor")
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void handlePooRecordCreated(PooRecordCreatedEvent event) {
    log.info("Async processing post-save effects for user: {}", event.email());

    User user = userService.getByEmail(event.email());

    // 경험치 추가
    user.addExp(event.rewardExp());
    userRepository.save(user);

    log.info("Finished async post-save effects for user: {}", event.email());
  }
}
