package com.daypoo.api.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
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
  @DisplayName("보유 포인트보다 많은 금액 차감은 400(S001) BusinessException을 던지고 잔액을 바꾸지 않는다")
  void deductPoints_insufficient_throwsBusinessException() {
    User user = newUser();
    user.addExpAndPoints(0, 5);

    assertThatThrownBy(() -> user.deductPoints(10))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.INSUFFICIENT_POINTS);
    assertThat(user.getPoints()).isEqualTo(5);
  }

  @Test
  @DisplayName("보유 포인트 이내의 차감은 잔액에서 정상 차감된다")
  void deductPoints_sufficient_deducts() {
    User user = newUser();
    user.addExpAndPoints(0, 10);

    user.deductPoints(7);

    assertThat(user.getPoints()).isEqualTo(3);
  }
}
