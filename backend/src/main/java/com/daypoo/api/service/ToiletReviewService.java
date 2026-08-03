package com.daypoo.api.service;

import com.daypoo.api.dto.*;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.ToiletReview;
import com.daypoo.api.entity.User;
import com.daypoo.api.event.ToiletReviewCreatedEvent;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.ToiletReviewRepository;
import com.daypoo.api.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToiletReviewService {

  private final ToiletReviewRepository toiletReviewRepository;
  private final ToiletRepository toiletRepository;
  private final UserRepository userRepository;
  private final ApplicationEventPublisher eventPublisher;

  @Transactional
  public ToiletReviewResponse createReview(
      String email, Long toiletId, ToiletReviewCreateRequest request) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    Toilet toilet =
        toiletRepository
            .findById(toiletId)
            .orElseThrow(() -> new BusinessException(ErrorCode.TOILET_NOT_FOUND));

    if (toiletReviewRepository.existsByUserIdAndToiletId(user.getId(), toiletId)) {
      throw new BusinessException(ErrorCode.ALREADY_REVIEWED);
    }

    String emojiTags =
        request.getEmojiTags() != null ? String.join(",", request.getEmojiTags()) : "";

    ToiletReview review =
        ToiletReview.builder()
            .user(user)
            .toilet(toilet)
            .rating(request.getRating())
            .emojiTags(emojiTags)
            .comment(request.getComment())
            .build();

    ToiletReview savedReview = toiletReviewRepository.save(review);

    // 화장실 통계 업데이트
    updateToiletStats(toilet);

    // 리뷰 5개 단위(5, 10, 15...)마다 AI 요약 재생성 (매 리뷰마다 호출하지 않음)
    int reviewCount = toilet.getReviewCount();
    if (reviewCount >= 5 && reviewCount % 5 == 0) {
      eventPublisher.publishEvent(new ToiletReviewCreatedEvent(toilet.getId()));
    }

    return ToiletReviewResponse.from(savedReview);
  }

  @Transactional(readOnly = true)
  public List<ToiletReviewResponse> getRecentReviews(Long toiletId) {
    return toiletReviewRepository.findTop5ByToiletIdOrderByCreatedAtDesc(toiletId).stream()
        .map(ToiletReviewResponse::from)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public ToiletReviewPageResponse getReviewsWithPaging(
      Long toiletId, int page, int size, String sort) {
    Pageable pageable = PageRequest.of(page, size);

    Page<ToiletReview> reviewPage =
        sort.equalsIgnoreCase("oldest")
            ? toiletReviewRepository.findByToiletIdOrderByCreatedAtAsc(toiletId, pageable)
            : toiletReviewRepository.findByToiletIdOrderByCreatedAtDesc(toiletId, pageable);

    List<ToiletReviewResponse> contents =
        reviewPage.getContent().stream()
            .map(ToiletReviewResponse::from)
            .collect(Collectors.toList());

    return ToiletReviewPageResponse.of(
        contents,
        reviewPage.getTotalElements(),
        reviewPage.getTotalPages(),
        reviewPage.getNumber(),
        reviewPage.hasNext());
  }

  @Transactional(readOnly = true)
  public ToiletReviewSummaryResponse getReviewSummary(Long toiletId) {
    Toilet toilet =
        toiletRepository
            .findById(toiletId)
            .orElseThrow(() -> new BusinessException(ErrorCode.TOILET_NOT_FOUND));

    List<ToiletReviewResponse> recentReviews = getRecentReviews(toiletId);
    long actualCount = toiletReviewRepository.countByToiletId(toiletId);
    String aiSummary = actualCount >= 5 ? toilet.getAiSummary() : null;

    return ToiletReviewSummaryResponse.builder()
        .aiSummary(aiSummary)
        .avgRating(toilet.getAvgRating())
        .reviewCount((int) actualCount)
        .recentReviews(recentReviews)
        .build();
  }

  private void updateToiletStats(Toilet toilet) {
    long count = toiletReviewRepository.countByToiletId(toilet.getId());
    Double avg = toiletReviewRepository.calculateAvgRatingByToiletId(toilet.getId());
    toilet.updateReviewStats(avg != null ? avg : 0.0, (int) count);
    toiletRepository.save(toilet);
  }
}
