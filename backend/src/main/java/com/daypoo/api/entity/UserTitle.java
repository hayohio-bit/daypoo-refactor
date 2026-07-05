package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_titles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserTitle extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "title_id", nullable = false)
  private Title title;

  @Builder
  public UserTitle(User user, Title title) {
    this.user = user;
    this.title = title;
  }
}
