package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.ItemType;
import lombok.Builder;

@Builder
public record ItemResponse(
    Long id,
    String name,
    String description,
    ItemType type,
    long price,
    Long discountPrice,
    String imageUrl,
    boolean owned,
    boolean published) {}
