package com.daypoo.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import com.daypoo.api.dto.AdminUserListResponse;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.service.AdminManagementService;
import java.time.LocalDateTime;
import java.util.Collections;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
@DisplayName("관리자 유저 컨트롤러 단위 테스트")
class AdminUserControllerTest {

  @InjectMocks private AdminUserController adminUserController;

  @Mock private AdminManagementService adminManagementService;

  @Test
  @DisplayName("성공: 유저 목록 조회 위임 확인")
  void getUsers_success() {
    // given
    AdminUserListResponse userResponse =
        AdminUserListResponse.builder()
            .id(1L)
            .email("test@example.com")
            .nickname("PoopKing")
            .role(Role.ROLE_USER)
            .plan(SubscriptionPlan.BASIC)
            .level(1)
            .points(100L)
            .recordCount(5)
            .createdAt(LocalDateTime.now())
            .build();

    Pageable pageable = PageRequest.of(0, 20);
    given(adminManagementService.getUsers(any(), any(), any(), any(Pageable.class)))
        .willReturn(new PageImpl<>(Collections.singletonList(userResponse)));

    // when
    ResponseEntity<Page<AdminUserListResponse>> response =
        adminUserController.getUsers("test", Role.ROLE_USER, SubscriptionPlan.BASIC, pageable);

    // then
    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    Page<AdminUserListResponse> body = response.getBody();
    assertThat(body).isNotNull();
    assertThat(body.getContent()).hasSize(1);
    assertThat(body.getContent().get(0).email()).isEqualTo("test@example.com");
    verify(adminManagementService, times(1))
        .getUsers(eq("test"), eq(Role.ROLE_USER), eq(SubscriptionPlan.BASIC), eq(pageable));
  }
}
