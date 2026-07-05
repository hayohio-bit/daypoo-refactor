package com.daypoo.api.dto;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record AdminToiletListResponse(
    Long id,
    String name,
    String mngNo,
    String address,
    String openHours,
    boolean is24h,
    boolean isUnisex,
    double latitude,
    double longitude,
    LocalDateTime createdAt) {}
