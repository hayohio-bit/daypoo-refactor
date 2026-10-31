package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.daypoo.api.entity.Notification;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.NotificationRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("알림 서비스 테스트")
class NotificationServiceTest {

  @InjectMocks private NotificationService notificationService;

  @Mock private NotificationRepository notificationRepository;

  private User owner;
  private User other;
  private Notification notification;

  @BeforeEach
  void setUp() {
    owner = User.builder().email("owner@example.com").nickname("owner").password("pw").build();
    ReflectionTestUtils.setField(owner, "id", 1L);
    other = User.builder().email("other@example.com").nickname("other").password("pw").build();
    ReflectionTestUtils.setField(other, "id", 2L);
    notification =
        Notification.builder()
            .user(owner)
            .type(NotificationType.SYSTEM)
            .title("t")
            .content("c")
            .build();
  }

  @Test
  @DisplayName("성공: 본인 알림은 읽음 처리된다")
  void markAsRead_owner() {
    given(notificationRepository.findById(10L)).willReturn(Optional.of(notification));

    notificationService.markAsRead(10L, owner);

    assertThat(notification.isRead()).isTrue();
  }

  @Test
  @DisplayName("실패: 다른 사용자의 알림은 읽음 처리할 수 없다")
  void markAsRead_notOwner() {
    given(notificationRepository.findById(10L)).willReturn(Optional.of(notification));

    assertThatThrownBy(() -> notificationService.markAsRead(10L, other))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.HANDLE_ACCESS_DENIED);
    assertThat(notification.isRead()).isFalse();
  }

  @Test
  @DisplayName("실패: 존재하지 않는 알림")
  void markAsRead_notFound() {
    given(notificationRepository.findById(99L)).willReturn(Optional.empty());

    assertThatThrownBy(() -> notificationService.markAsRead(99L, owner))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.ENTITY_NOT_FOUND);
  }
}
