package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.ItemType;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Item extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ItemType type;

  @Column(nullable = false)
  private long price;

  @Column(name = "image_url", length = 1024)
  private String imageUrl;

  @Column(name = "discount_price")
  private Long discountPrice;

  @Column(nullable = false)
  private boolean published = false;

  @Builder
  public Item(
      String name,
      String description,
      ItemType type,
      long price,
      String imageUrl,
      Long discountPrice) {
    this.name = name;
    this.description = description;
    this.type = type;
    this.price = price;
    this.imageUrl = imageUrl;
    this.discountPrice = discountPrice;
    this.published = false;
  }

  public void update(
      String name,
      String description,
      ItemType type,
      long price,
      String imageUrl,
      Long discountPrice) {
    this.name = name;
    this.description = description;
    this.type = type;
    this.price = price;
    this.imageUrl = imageUrl;
    this.discountPrice = discountPrice;
  }

  public void publish() {
    this.published = true;
  }

  public void unpublish() {
    this.published = false;
  }

  /** 실제 결제 금액 (할인가가 있으면 할인가, 없으면 원가) */
  public long getEffectivePrice() {
    return discountPrice != null ? discountPrice : price;
  }
}
