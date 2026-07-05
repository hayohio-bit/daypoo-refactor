package com.daypoo.api.dto;

import java.util.List;
import lombok.Builder;

/** 배변 기록 생성 요청 DTO (방문 인증 통합 대응) toiletId, latitude, longitude가 null이면 방문 인증 없이 건강 기록만 수행합니다. */
@Builder
public record PooRecordCreateRequest(
    Long toiletId,
    Integer bristolScale,
    String color,
    List<String> conditionTags,
    List<String> dietTags,
    Double latitude,
    Double longitude,
    String imageBase64 // AI 분석용 (Optional)
    ) {}
