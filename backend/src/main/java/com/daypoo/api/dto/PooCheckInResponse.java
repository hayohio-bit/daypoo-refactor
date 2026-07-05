package com.daypoo.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "화장실 체크인(도착) 응답 관리 객체")
public record PooCheckInResponse(
    @Schema(description = "체크인한 화장실 ID", example = "38") Long toiletId,
    @Schema(description = "최초 прибы(도착) 시간 (서버 기준)", example = "2026-03-23T18:00:00")
        LocalDateTime firstArrivalTime,
    @Schema(description = "현재까지 경과된 체류 시간(초)", example = "45") long elapsedSeconds,
    @Schema(description = "인증 성공을 위해 대기해야 할 남은 시간(초). 0이면 즉시 인증 가능.", example = "15")
        long remainedSeconds) {}
