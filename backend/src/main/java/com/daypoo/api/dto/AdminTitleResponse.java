package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.AchievementType;
import java.time.LocalDateTime;

public record AdminTitleResponse(
    Long id,
    String name,
    String description,
    String imageUrl,
    AchievementType achievementType,
    Integer achievementThreshold,
    LocalDateTime createdAt) {}
