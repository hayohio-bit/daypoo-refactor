package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record TokenResponse(String accessToken, String refreshToken) {}
