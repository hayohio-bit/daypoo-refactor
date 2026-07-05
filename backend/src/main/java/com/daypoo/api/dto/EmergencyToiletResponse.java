package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record EmergencyToiletResponse(Long id, String name, double distance, boolean is24h) {}
