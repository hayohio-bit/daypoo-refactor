package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.Role;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminUserDetailResponse(
    Long id,
    String email,
    String nickname,
    Role role,
    int level,
    long exp,
    long recordCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {}
