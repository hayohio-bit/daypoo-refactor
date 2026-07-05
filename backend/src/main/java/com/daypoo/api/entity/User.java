package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false, unique = true, length = 100)
  private String email;

  @Column(nullable = false, unique = true, length = 50)
  private String nickname;

  @Column(name = "equipped_title_id")
  private Long equippedTitleId;

  @Column(name = "home_region", length = 50)
  private String homeRegion;

  @Column(nullable = false)
  private int level = 1;

  @Column(nullable = false)
  private long exp = 0L;

  @Column(nullable = false)
  private long points = 0L;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<PooRecord> records = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<UserTitle> titles = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<Notification> notifications = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<Inventory> inventories = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<Payment> payments = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<ToiletReview> reviews = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<Subscription> subscriptions = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<Favorite> favorites = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<Inquiry> inquiries = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<VisitLog> visitLogs = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<HealthReportSnapshot> healthReportSnapshots = new ArrayList<>();

  @Builder
  public User(String password, String email, String nickname, Role role) {
    this.password = password;
    this.email = email;
    this.nickname = nickname;
    this.role = role != null ? role : Role.ROLE_USER;
    this.level = 1;
    this.exp = 0L;
    this.points = 0L;
  }

  private static final int MAX_LEVEL = 30;

  public void addExpAndPoints(long addedExp, long addedPoints) {
    this.exp += addedExp;
    this.points += addedPoints;

    // Simple level up logic: level * 100 exp to level up
    while (this.level < MAX_LEVEL && this.exp >= this.level * 100) {
      this.exp -= this.level * 100;
      this.level += 1;
    }
  }

  public void deductPoints(long amount) {
    if (this.points < amount) {
      throw new IllegalStateException("포인트가 부족합니다.");
    }
    this.points -= amount;
  }

  public void equipTitle(Long titleId) {
    this.equippedTitleId = titleId;
  }

  public void updateHomeRegion(String regionName) {
    if (regionName != null && !regionName.isBlank()) {
      this.homeRegion = regionName;
    }
  }

  public void updateNickname(String nickname) {
    this.nickname = nickname;
  }

  public void updatePassword(String password) {
    this.password = password;
  }

  public void updateRole(Role role) {
    this.role = role;
  }

  /** 현재 활성 구독 조회 */
  public Subscription getActiveSubscription() {
    return subscriptions.stream().filter(Subscription::isActive).findFirst().orElse(null);
  }

  /** PRO 멤버십 여부 확인 */
  public boolean isPro() {
    Subscription active = getActiveSubscription();
    if (active == null) return false;

    com.daypoo.api.entity.enums.SubscriptionPlan plan = active.getPlan();
    return plan == com.daypoo.api.entity.enums.SubscriptionPlan.PRO
        || plan == com.daypoo.api.entity.enums.SubscriptionPlan.PREMIUM;
  }

  /** 특정 플랜 확인 */
  public boolean hasPlan(com.daypoo.api.entity.enums.SubscriptionPlan plan) {
    Subscription active = getActiveSubscription();
    return active != null && active.getPlan() == plan;
  }
}
