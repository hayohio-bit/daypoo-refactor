package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminUserDetailResponse(
    Long id,
    String email,
    String nickname,
    Role role,
    SubscriptionPlan plan,
    int level,
    long exp,
    long points,
    long recordCount,
    long paymentCount,
    long totalPaymentAmount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {}
