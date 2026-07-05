package com.daypoo.api.dto;

import com.daypoo.api.entity.ToiletReview;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import lombok.Builder;

@Builder
public record ToiletReviewResponse(
    Long id,
    String userName,
    Integer rating,
    List<String> emojiTags,
    String comment,
    Integer helpfulCount,
    LocalDateTime createdAt) {

  public static ToiletReviewResponse from(ToiletReview review) {
    List<String> tags = Collections.emptyList();
    if (review.getEmojiTags() != null && !review.getEmojiTags().isBlank()) {
      tags = Arrays.asList(review.getEmojiTags().split(","));
    }

    return ToiletReviewResponse.builder()
        .id(review.getId())
        .userName(review.getUser().getNickname())
        .rating(review.getRating())
        .emojiTags(tags)
        .comment(review.getComment())
        .helpfulCount(review.getHelpfulCount())
        .createdAt(review.getCreatedAt())
        .build();
  }
}
