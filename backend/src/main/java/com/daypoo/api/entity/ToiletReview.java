package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "toilet_reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ToiletReview extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "toilet_id", nullable = false)
  private Toilet toilet;

  @Column(nullable = false)
  private Integer rating;

  @Column(columnDefinition = "TEXT")
  private String emojiTags;

  @Column(columnDefinition = "TEXT")
  private String comment;

  @Column(name = "helpful_count")
  private Integer helpfulCount = 0;

  @Builder
  public ToiletReview(User user, Toilet toilet, Integer rating, String emojiTags, String comment) {
    this.user = user;
    this.toilet = toilet;
    this.rating = rating;
    this.emojiTags = emojiTags;
    this.comment = comment;
    this.helpfulCount = 0;
  }

  public void increaseHelpfulCount() {
    this.helpfulCount++;
  }
}
