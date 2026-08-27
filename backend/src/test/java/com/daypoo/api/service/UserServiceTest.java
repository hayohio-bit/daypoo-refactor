package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("사용자 서비스 테스트")
class UserServiceTest {

  @InjectMocks private UserService userService;

  @Mock private UserRepository userRepository;
  @Mock private PooRecordRepository pooRecordRepository;

  @Test
  @DisplayName("성공: 이메일로 사용자 조회")
  void getByEmail_success() {
    User user =
        User.builder()
            .email("test@example.com")
            .password("encodedPassword")
            .nickname("PoopKing")
            .role(Role.ROLE_USER)
            .build();
    given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(user));

    User found = userService.getByEmail("test@example.com");

    assertThat(found).isSameAs(user);
  }

  @Test
  @DisplayName("실패: 존재하지 않는 이메일 조회 시 USER_NOT_FOUND")
  void getByEmail_fail_userNotFound() {
    given(userRepository.findByEmail("none@example.com")).willReturn(Optional.empty());

    assertThatThrownBy(() -> userService.getByEmail("none@example.com"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.USER_NOT_FOUND);
  }
}
