package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.Role;
import jakarta.validation.constraints.NotNull;

public record AdminRoleUpdateRequest(@NotNull(message = "역할은 필수 입력값입니다.") Role role) {}
