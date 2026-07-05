package com.daypoo.api.event;

import com.daypoo.api.dto.AiReviewSummaryRequest;
import com.daypoo.api.dto.AiReviewSummaryResponse;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.ToiletReview;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.ToiletReviewRepository;
import com.daypoo.api.service.AiClient;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToiletReviewEventListener {

  private final ToiletRepository toiletRepository;
  private final ToiletReviewRepository toiletReviewRepository;
  private final AiClient aiClient;

  @Async("taskExecutor")
  @EventListener
  @Transactional
  public void handleToiletReviewCreated(ToiletReviewCreatedEvent event) {
    log.info("Async processing AI summary for toilet: {}", event.toiletId());

    Toilet toilet =
        toiletRepository
            .findById(event.toiletId())
            .orElseThrow(
                () -> new IllegalArgumentException("Toilet not found: " + event.toiletId()));

    try {
      List<String> lastReviews =
          toiletReviewRepository.findTop5ByToiletIdOrderByCreatedAtDesc(toilet.getId()).stream()
              .map(ToiletReview::getComment)
              .collect(Collectors.toList());

      AiReviewSummaryRequest request =
          new AiReviewSummaryRequest(toilet.getId(), toilet.getName(), lastReviews);

      AiReviewSummaryResponse response = aiClient.summarizeReviews(request);
      if (response != null && response.summary() != null) {
        toilet.updateAiSummary(response.summary());
        toiletRepository.save(toilet);
        log.info("Finished async AI summary for toilet: {}", event.toiletId());
      }
    } catch (Exception e) {
      log.error("AI 요약 생성 중 오류 발생 (화장실 ID: {}): {}", toilet.getId(), e.getMessage());
    }
  }
}
