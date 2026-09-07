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

  @Column(name = "home_region", length = 50)
  private String homeRegion;

  @Column(nullable = false)
  private int level = 1;

  @Column(nullable = false)
  private long exp = 0L;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<PooRecord> records = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<Notification> notifications = new ArrayList<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<ToiletReview> reviews = new ArrayList<>();

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
  }

  private static final int MAX_LEVEL = 30;

  public void addExp(long addedExp) {
    this.exp += addedExp;

    // Simple level up logic: level * 100 exp to level up
    while (this.level < MAX_LEVEL && this.exp >= this.level * 100) {
      this.exp -= this.level * 100;
      this.level += 1;
    }
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
}
