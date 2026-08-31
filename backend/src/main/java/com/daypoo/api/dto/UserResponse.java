package com.daypoo.api.dto;

import com.daypoo.api.entity.User;
import lombok.Builder;

@Builder
public record UserResponse(
    Long id,
    String email,
    String nickname,
    String role,
    int level,
    long exp,
    String birthDate,
    String createdAt,
    Long totalAuthCount,
    Long totalVisitCount,
    Integer consecutiveDays,
    String homeRegion) {

  public static UserResponse from(User user) {
    return from(user, null, null, null);
  }

  public static UserResponse from(
      User user, Long totalAuthCount, Long totalVisitCount, Integer consecutiveDays) {

    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole().name())
        .level(user.getLevel())
        .exp(user.getExp())
        .birthDate(null)
        .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
        .totalAuthCount(totalAuthCount)
        .totalVisitCount(totalVisitCount)
        .consecutiveDays(consecutiveDays)
        .homeRegion(user.getHomeRegion())
        .build();
  }
}
