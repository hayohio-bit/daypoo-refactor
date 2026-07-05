package com.daypoo.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ToiletReviewCreateRequest {

  @NotNull(message = "평점은 필수입니다.")
  @Min(value = 1, message = "평점은 최소 1점입니다.")
  @Max(value = 5, message = "평점은 최대 5점입니다.")
  private Integer rating;

  private List<String> emojiTags;

  @NotBlank(message = "리뷰 내용은 필수입니다.")
  private String comment;

  public ToiletReviewCreateRequest(Integer rating, List<String> emojiTags, String comment) {
    this.rating = rating;
    this.emojiTags = emojiTags;
    this.comment = comment;
  }
}
