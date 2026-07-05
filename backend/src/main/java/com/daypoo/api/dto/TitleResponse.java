package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record TitleResponse(
    Long id,
    String name,
    String description,
    String requirementDescription,
    boolean isOwned,
    boolean isEquipped,
    String achievementType,
    Integer achievementThreshold,
    Long currentProgress,
    String conditionLabel) {}
