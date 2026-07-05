package com.daypoo.api.dto;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record InquiryResponse(
    Long id,
    String category,
    String title,
    String content,
    String answer,
    String status,
    LocalDateTime createdAt) {}
