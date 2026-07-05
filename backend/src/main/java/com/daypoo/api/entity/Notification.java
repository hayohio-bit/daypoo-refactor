package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private NotificationType type;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(name = "redirect_url")
  private String redirectUrl; // 클릭 시 이동할 페이지 경로

  @Column(name = "is_read", nullable = false)
  private boolean isRead = false;

  @Builder
  public Notification(
      User user, NotificationType type, String title, String content, String redirectUrl) {
    this.user = user;
    this.type = type;
    this.title = title;
    this.content = content;
    this.redirectUrl = redirectUrl;
    this.isRead = false;
  }

  public void markAsRead() {
    this.isRead = true;
  }
}
