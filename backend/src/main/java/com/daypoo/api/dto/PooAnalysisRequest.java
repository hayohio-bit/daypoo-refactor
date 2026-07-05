package com.daypoo.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "AI 배변 이미지 분석 요청")
public record PooAnalysisRequest(
    @NotBlank(message = "분석할 이미지(Base64)는 필수입니다.")
        @Schema(description = "배변 이미지 (Base64 인코딩 스트링)", example = "data:image/jpeg;base64,...")
        String imageBase64) {}
