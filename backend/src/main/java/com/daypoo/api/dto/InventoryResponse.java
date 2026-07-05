package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record InventoryResponse(
    Long id, Long itemId, String itemName, String itemType, boolean isEquipped, String imageUrl) {}
