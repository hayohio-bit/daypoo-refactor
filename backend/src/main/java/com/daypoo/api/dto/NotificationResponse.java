package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.NotificationType;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record NotificationResponse(
    Long id,
    Long userId,
    NotificationType type,
    String title,
    String content,
    String redirectUrl,
    boolean isRead,
    LocalDateTime createdAt) {}
