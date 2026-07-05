package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record ToiletResponse(
    Long id,
    String name,
    double latitude,
    double longitude,
    String address,
    String openHours,
    boolean is24h,
    double distance) {}
