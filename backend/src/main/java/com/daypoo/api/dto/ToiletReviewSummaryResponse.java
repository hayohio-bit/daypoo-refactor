package com.daypoo.api.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record ToiletReviewSummaryResponse(
    String aiSummary,
    Double avgRating,
    Integer reviewCount,
    List<ToiletReviewResponse> recentReviews) {}
