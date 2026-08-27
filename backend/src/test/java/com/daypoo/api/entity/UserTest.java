package com.daypoo.api.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.daypoo.api.entity.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("User 엔티티 단위 테스트")
class UserTest {

  private User newUser() {
    return User.builder()
        .email("user@daypoo.com")
        .nickname("테스터")
        .password("encoded")
        .role(Role.ROLE_USER)
        .build();
  }

  @Test
  @DisplayName("레벨업 기준(레벨×100) 미만의 경험치 획득은 레벨을 올리지 않는다")
  void addExp_belowThreshold_keepsLevel() {
    User user = newUser();

    user.addExp(99);

    assertThat(user.getLevel()).isEqualTo(1);
    assertThat(user.getExp()).isEqualTo(99);
  }

  @Test
  @DisplayName("레벨업 기준을 넘는 경험치 획득은 초과분을 이월하며 레벨을 올린다")
  void addExp_overThreshold_levelsUpWithCarryOver() {
    User user = newUser();

    user.addExp(150); // 레벨1 기준 100 소모, 50 이월

    assertThat(user.getLevel()).isEqualTo(2);
    assertThat(user.getExp()).isEqualTo(50);
  }
}
