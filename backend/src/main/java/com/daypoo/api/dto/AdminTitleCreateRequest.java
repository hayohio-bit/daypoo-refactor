package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.AchievementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record AdminTitleCreateRequest(
    @NotBlank(message = "칭호 이름은 필수 입력값입니다.") String name,
    @NotBlank(message = "설명은 필수 입력값입니다.") String description,
    String imageUrl,
    @NotNull(message = "업적 타입은 필수입니다.") AchievementType achievementType,
    @NotNull(message = "임계값은 필수입니다.") @PositiveOrZero(message = "임계값은 0 이상이어야 합니다.")
        Integer achievementThreshold) {}
