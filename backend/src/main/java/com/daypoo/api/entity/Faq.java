package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "faqs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Faq extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String category; // 예: 건강, 결제, 계정

  @Column(nullable = false)
  private String question;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String answer;

  @Builder
  public Faq(String category, String question, String answer) {
    this.category = category;
    this.question = question;
    this.answer = answer;
  }
}
