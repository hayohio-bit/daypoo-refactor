package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.InquiryStatus;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminInquiryListResponse(
    Long id,
    String userName,
    String userEmail,
    String type,
    String title,
    InquiryStatus status,
    LocalDateTime createdAt) {}
