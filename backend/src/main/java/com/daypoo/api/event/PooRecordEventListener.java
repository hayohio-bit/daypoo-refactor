package com.daypoo.api.event;

import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
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

  @Async("taskExecutor")
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void handlePooRecordCreated(PooRecordCreatedEvent event) {
    log.info("Async processing post-save effects for user: {}", event.email());

    User user =
        userRepository
            .findByEmail(event.email())
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + event.email()));

    // 경험치 및 포인트 추가
    user.addExpAndPoints(event.rewardExp(), event.rewardPoints());
    userRepository.save(user);

    log.info("Finished async post-save effects for user: {}", event.email());
  }
}
