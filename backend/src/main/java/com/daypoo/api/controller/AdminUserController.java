package com.daypoo.api.controller;

import com.daypoo.api.dto.AdminRoleUpdateRequest;
import com.daypoo.api.dto.AdminUserDetailResponse;
import com.daypoo.api.dto.AdminUserListResponse;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.service.AdminManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - User", description = "관리자 전용 유저 관리 API")
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

  private final AdminManagementService adminManagementService;

  @Operation(
      summary = "유저 목록 조회 및 검색",
      description = "이메일/닉네임 검색 및 역할/구독 플랜 필터링이 가능한 유저 목록을 조회합니다.")
  @GetMapping
  public ResponseEntity<Page<AdminUserListResponse>> getUsers(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Role role,
      @RequestParam(required = false) SubscriptionPlan plan,
      @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    return ResponseEntity.ok(adminManagementService.getUsers(search, role, plan, pageable));
  }

  @Operation(
      summary = "유저 상세 정보 조회",
      description = "특정 유저의 활동 지표(기록 수, 결제 정보 등)를 포함한 상세 정보를 조회합니다.")
  @GetMapping("/{id}")
  public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable Long id) {
    return ResponseEntity.ok(adminManagementService.getUserDetail(id));
  }

  @Operation(summary = "유저 역할(권한) 변경", description = "특정 유저의 역할을 변경합니다 (본인 역할 변경은 불가).")
  @PatchMapping("/{id}/role")
  public ResponseEntity<Void> updateUserRole(
      @PathVariable Long id,
      @RequestBody AdminRoleUpdateRequest request,
      @AuthenticationPrincipal String email) {
    adminManagementService.updateUserRole(id, request.role(), email);
    return ResponseEntity.ok().build();
  }

  @Operation(
      summary = "유저 삭제 (물리적 삭제)",
      description = "특정 유저를 데이터베이스에서 영구적으로 삭제합니다. 본인 삭제는 불가능합니다.")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteUser(
      @PathVariable Long id, @AuthenticationPrincipal String email) {
    adminManagementService.deleteUser(id, email);
    return ResponseEntity.ok().build();
  }
}
