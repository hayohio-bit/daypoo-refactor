package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.AchievementType;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "titles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Title extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 100)
  private String name;

  @Column(nullable = false)
  private String description;

  @Column(name = "image_url", length = 1024)
  private String imageUrl;

  /** 부여 조건 타입 (예: CONTINUOUS_RECORDS, TOTAL_RECORDS, UNIQUE_TOILETS) */
  @Enumerated(EnumType.STRING)
  @Column(name = "achievement_type", nullable = false)
  private AchievementType achievementType;

  /** 조건 임계값 (예: 7회, 10곳 등) */
  @Column(name = "achievement_threshold", nullable = false)
  private Integer achievementThreshold;

  @Builder
  public Title(
      String name,
      String description,
      String imageUrl,
      AchievementType achievementType,
      Integer achievementThreshold) {
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
    this.achievementType = achievementType;
    this.achievementThreshold = achievementThreshold;
  }

  public void update(
      String name,
      String description,
      String imageUrl,
      AchievementType achievementType,
      Integer achievementThreshold) {
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
    this.achievementType = achievementType;
    this.achievementThreshold = achievementThreshold;
  }
}
