package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.Role;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminUserListResponse(
    Long id,
    String email,
    String nickname,
    Role role,
    int level,
    long recordCount,
    LocalDateTime createdAt) {}
