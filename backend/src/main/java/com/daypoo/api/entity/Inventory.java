package com.daypoo.api.entity;

import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inventories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inventory extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "item_id", nullable = false)
  private Item item;

  @Column(name = "is_equipped", nullable = false)
  private boolean isEquipped = false;

  @Builder
  public Inventory(User user, Item item, boolean isEquipped) {
    this.user = user;
    this.item = item;
    this.isEquipped = isEquipped;
  }

  public void equip() {
    this.isEquipped = true;
  }

  public void unequip() {
    this.isEquipped = false;
  }
}
