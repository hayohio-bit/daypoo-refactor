package com.daypoo.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record PooCheckInRequest(
    @NotNull(message = "화장실 정보는 필수입니다.") Long toiletId,
    @NotNull(message = "위도는 필수입니다.") double latitude,
    @NotNull(message = "경도는 필수입니다.") double longitude) {}
