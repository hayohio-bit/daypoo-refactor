package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "poo_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PooRecord extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "toilet_id", nullable = true)
  private Toilet toilet;

  @Column(name = "bristol_scale", nullable = false)
  private Integer bristolScale;

  @Column(nullable = false, length = 50)
  private String color;

  @Column(name = "condition_tags")
  private String conditionTags;

  @Column(name = "diet_tags")
  private String dietTags;

  @Column(name = "region_name")
  private String regionName;

  @Column(name = "warning_tags")
  private String warningTags;

  @Builder
  public PooRecord(
      User user,
      Toilet toilet,
      Integer bristolScale,
      String color,
      String conditionTags,
      String dietTags,
      String regionName,
      String warningTags) {
    this.user = user;
    this.toilet = toilet;
    this.bristolScale = bristolScale;
    this.color = color;
    this.conditionTags = conditionTags;
    this.dietTags = dietTags;
    this.regionName = regionName;
    this.warningTags = warningTags;
  }
}
