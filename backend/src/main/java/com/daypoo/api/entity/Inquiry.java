package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.InquiryStatus;
import com.daypoo.api.entity.enums.InquiryType;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import jakarta.persistence.Lob;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inquiries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InquiryType type;

  @Column(nullable = false, length = 1000)
  private String title;

  @Lob
  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Lob
  @Column(columnDefinition = "TEXT")
  private String answer;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InquiryStatus status = InquiryStatus.PENDING;

  @Builder
  public Inquiry(User user, InquiryType type, String title, String content) {
    this.user = user;
    this.type = type;
    this.title = title;
    this.content = content;
    this.status = InquiryStatus.PENDING;
  }

  public void answer(String answer) {
    this.answer = answer;
    this.status = InquiryStatus.COMPLETED;
  }

  public void update(String title, String content, InquiryType type) {
    this.title = title;
    this.content = content;
    this.type = type;
  }
}
