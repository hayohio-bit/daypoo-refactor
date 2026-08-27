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
    Long equippedTitleId,
    String equippedTitleName,
    String equippedAvatarUrl,
    Long totalAuthCount,
    Long totalVisitCount,
    Integer consecutiveDays,
    String homeRegion) {

  public static UserResponse from(User user) {
    return from(user, null, null, null, null, null);
  }

  public static UserResponse from(User user, String equippedTitleName) {
    return from(user, equippedTitleName, null, null, null, null);
  }

  public static UserResponse from(
      User user,
      String equippedTitleName,
      Long totalAuthCount,
      Long totalVisitCount,
      Integer consecutiveDays,
      String equippedAvatarUrl) {

    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole().name())
        .level(user.getLevel())
        .exp(user.getExp())
        .birthDate(null)
        .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
        .equippedTitleId(user.getEquippedTitleId())
        .equippedTitleName(equippedTitleName)
        .equippedAvatarUrl(equippedAvatarUrl)
        .totalAuthCount(totalAuthCount)
        .totalVisitCount(totalVisitCount)
        .consecutiveDays(consecutiveDays)
        .homeRegion(user.getHomeRegion())
        .build();
  }
}
