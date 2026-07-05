package com.daypoo.api.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record PooRecordResponse(
    Long id,
    Long userId,
    Long toiletId,
    String toiletName,
    Integer bristolScale,
    String color,
    List<String> conditionTags,
    List<String> dietTags,
    List<String> warningTags,
    Integer earnedExp,
    Integer earnedPoints,
    LocalDateTime createdAt) {}
