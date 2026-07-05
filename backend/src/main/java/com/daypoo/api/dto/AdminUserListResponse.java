package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminUserListResponse(
    Long id,
    String email,
    String nickname,
    Role role,
    SubscriptionPlan plan,
    int level,
    long points,
    long recordCount,
    LocalDateTime createdAt) {}
