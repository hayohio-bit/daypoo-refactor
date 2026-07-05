package com.daypoo.api.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record UserRankResponse(
    Long userId,
    String nickname,
    String titleName,
    int level,
    long score,
    long rank,
    List<EquippedItemResponse> equippedItems,
    String equippedAvatarUrl) {}
