package com.daypoo.api.dto;

import com.daypoo.api.entity.enums.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record AdminItemCreateRequest(
    @NotBlank(message = "아이템 이름은 필수 입력값입니다.") String name,
    @NotBlank(message = "설명은 필수 입력값입니다.") String description,
    ItemType type,
    @PositiveOrZero(message = "가격은 0 이상이어야 합니다.") long price,
    String imageUrl,
    @PositiveOrZero(message = "할인가는 0 이상이어야 합니다.") Long discountPrice) {}
