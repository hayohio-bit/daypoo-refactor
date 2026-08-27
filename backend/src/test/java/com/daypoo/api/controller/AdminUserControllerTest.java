package com.daypoo.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.daypoo.api.dto.AdminRoleUpdateRequest;
import com.daypoo.api.dto.AdminUserDetailResponse;
import com.daypoo.api.dto.AdminUserListResponse;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.service.AdminUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** AdminUserController Standalone MockMvc 테스트. DB, Redis 등 외부 인프라 없이 컨트롤러 레이어만 단독 검증합니다. */
@ExtendWith(MockitoExtension.class)
@DisplayName("관리자 유저 컨트롤러 MockMvc 테스트")
class AdminUserControllerTest {

  private MockMvc mockMvc;
  // JavaTimeModule 등록으로 LocalDateTime 직렬화 지원
  private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

  @Mock private AdminUserService adminUserService;

  @InjectMocks private AdminUserController adminUserController;

  @BeforeEach
  void setUp() {
    // Page 직렬화를 위해 JavaTimeModule이 포함된 커스텀 MappingJackson2HttpMessageConverter 사용
    MappingJackson2HttpMessageConverter converter =
        new MappingJackson2HttpMessageConverter(objectMapper);
    mockMvc =
        MockMvcBuilders.standaloneSetup(adminUserController)
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .setMessageConverters(converter)
            .build();
  }

  @Test
  @DisplayName("성공: 유저 목록 조회 API")
  void getUsers_success() throws Exception {
    // given
    AdminUserListResponse userResponse =
        AdminUserListResponse.builder()
            .id(1L)
            .email("test@example.com")
            .nickname("PoopKing")
            .role(Role.ROLE_USER)
            .level(1)
            .recordCount(5)
            .createdAt(LocalDateTime.now())
            .build();

    given(adminUserService.getUsers(any(), any(), any(Pageable.class)))
        .willReturn(
            new PageImpl<>(
                new ArrayList<>(Collections.singletonList(userResponse)),
                PageRequest.of(0, 20),
                1));

    // when & then
    mockMvc
        .perform(
            get("/api/v1/admin/users")
                .param("search", "test")
                .param("role", "ROLE_USER")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].email").value("test@example.com"))
        .andExpect(jsonPath("$.content[0].nickname").value("PoopKing"));
  }

  @Test
  @DisplayName("성공: 유저 상세 정보 조회 API")
  void getUserDetail_success() throws Exception {
    // given
    AdminUserDetailResponse detailResponse =
        AdminUserDetailResponse.builder()
            .id(1L)
            .email("test@example.com")
            .nickname("PoopKing")
            .role(Role.ROLE_USER)
            .level(1)
            .createdAt(LocalDateTime.now())
            .build();

    given(adminUserService.getUserDetail(1L)).willReturn(detailResponse);

    // when & then
    mockMvc
        .perform(get("/api/v1/admin/users/{id}", 1L).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("test@example.com"))
        .andExpect(jsonPath("$.nickname").value("PoopKing"));
  }

  @Test
  @DisplayName("성공: 유저 권한 변경 API")
  void updateUserRole_success() throws Exception {
    // given
    AdminRoleUpdateRequest request = new AdminRoleUpdateRequest(Role.ROLE_ADMIN);
    doNothing().when(adminUserService).updateUserRole(eq(1L), eq(Role.ROLE_ADMIN), any());

    // when & then
    mockMvc
        .perform(
            patch("/api/v1/admin/users/{id}/role", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());
  }

  @Test
  @DisplayName("성공: 유저 영구 삭제 API")
  void deleteUser_success() throws Exception {
    // given
    doNothing().when(adminUserService).deleteUser(eq(1L), any());

    // when & then
    mockMvc
        .perform(delete("/api/v1/admin/users/{id}", 1L).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());
  }
}
