package com.daypoo.api.dto;

import java.util.List;

public record AiReviewSummaryRequest(Long toiletId, String toiletName, List<String> reviews) {}
