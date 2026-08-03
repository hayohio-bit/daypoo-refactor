package com.daypoo.api.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToiletReviewEventListener {

  @Async("taskExecutor")
  @EventListener
  public void handleToiletReviewCreated(ToiletReviewCreatedEvent event) {
    log.info("Review event received for toilet: {} (AI summary disabled)", event.toiletId());
  }
}
