package com.daypoo.api.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record ToiletReviewPageResponse(
    List<ToiletReviewResponse> contents,
    long totalElements,
    int totalPages,
    int currentPage,
    boolean hasNext) {

  public static ToiletReviewPageResponse of(
      List<ToiletReviewResponse> contents,
      long totalElements,
      int totalPages,
      int currentPage,
      boolean hasNext) {
    return ToiletReviewPageResponse.builder()
        .contents(contents)
        .totalElements(totalElements)
        .totalPages(totalPages)
        .currentPage(currentPage)
        .hasNext(hasNext)
        .build();
  }
}
