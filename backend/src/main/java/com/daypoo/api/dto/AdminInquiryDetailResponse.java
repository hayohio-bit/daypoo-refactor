package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.InquiryStatus;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminInquiryDetailResponse(
    Long id,
    String userName,
    String userEmail,
    String type,
    String title,
    String content,
    String answer,
    InquiryStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {}
