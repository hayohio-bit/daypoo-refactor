package com.daypoo.api.dto;

import com.daypoo.api.entity.VisitLog;
import com.daypoo.api.entity.enums.VisitEventType;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record VisitLogResponse(
    Long id,
    Long toiletId,
    String toiletName,
    VisitEventType eventType,
    LocalDateTime arrivalAt,
    LocalDateTime completedAt,
    Integer dwellSeconds,
    Double distanceMeters,
    String failureReason,
    LocalDateTime createdAt) {

  public static VisitLogResponse from(VisitLog log) {
    return VisitLogResponse.builder()
        .id(log.getId())
        .toiletId(log.getToilet().getId())
        .toiletName(log.getToilet().getName())
        .eventType(log.getEventType())
        .arrivalAt(log.getArrivalAt())
        .completedAt(log.getCompletedAt())
        .dwellSeconds(log.getDwellSeconds())
        .distanceMeters(log.getDistanceMeters())
        .failureReason(log.getFailureReason())
        .createdAt(log.getCreatedAt())
        .build();
  }
}
