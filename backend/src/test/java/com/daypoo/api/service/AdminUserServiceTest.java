package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.PaymentRepository;
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
@DisplayName("관리자 유저 서비스 단위 테스트 (사용자 권한·삭제)")
class AdminUserServiceTest {

  @InjectMocks private AdminUserService adminUserService;

  @Mock private UserRepository userRepository;
  @Mock private PaymentRepository paymentRepository;
  @Mock private PooRecordRepository pooRecordRepository;
  @Mock private UserDeletionService userDeletionService;

  private static final String ADMIN_EMAIL = "admin@daypoo.com";

  private User givenUser(Long id, String email) {
    User user = mock(User.class);
    given(user.getEmail()).willReturn(email);
    given(userRepository.findById(id)).willReturn(Optional.of(user));
    return user;
  }

  @Test
  @DisplayName("관리자는 자기 자신의 역할을 변경할 수 없다 (A006)")
  void updateUserRole_self_throws() {
    User self = givenUser(1L, ADMIN_EMAIL);

    assertThatThrownBy(() -> adminUserService.updateUserRole(1L, Role.ROLE_USER, ADMIN_EMAIL))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.ADMIN_CANNOT_CHANGE_OWN_ROLE);
    verify(self, never()).updateRole(org.mockito.ArgumentMatchers.any());
  }

  @Test
  @DisplayName("다른 사용자의 역할 변경은 정상 수행된다")
  void updateUserRole_otherUser_updates() {
    User target = givenUser(2L, "user@daypoo.com");

    adminUserService.updateUserRole(2L, Role.ROLE_ADMIN, ADMIN_EMAIL);

    verify(target).updateRole(Role.ROLE_ADMIN);
  }

  @Test
  @DisplayName("존재하지 않는 사용자의 역할 변경은 404(A001)를 던진다")
  void updateUserRole_notFound_throws() {
    given(userRepository.findById(99L)).willReturn(Optional.empty());

    assertThatThrownBy(() -> adminUserService.updateUserRole(99L, Role.ROLE_USER, ADMIN_EMAIL))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.ADMIN_USER_NOT_FOUND);
  }

  @Test
  @DisplayName("관리자는 자기 자신의 계정을 삭제할 수 없다 (A008)")
  void deleteUser_self_throws() {
    givenUser(1L, ADMIN_EMAIL);

    assertThatThrownBy(() -> adminUserService.deleteUser(1L, ADMIN_EMAIL))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.ADMIN_CANNOT_DELETE_SELF);
    verify(userDeletionService, never())
        .deleteUserAndRelatedData(org.mockito.ArgumentMatchers.any());
  }

  @Test
  @DisplayName("다른 사용자 삭제는 회원 삭제 서비스에 위임된다")
  void deleteUser_otherUser_delegates() {
    User target = givenUser(2L, "user@daypoo.com");

    adminUserService.deleteUser(2L, ADMIN_EMAIL);

    verify(userDeletionService).deleteUserAndRelatedData(target);
  }
}
