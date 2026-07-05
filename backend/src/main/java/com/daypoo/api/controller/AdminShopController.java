package com.daypoo.api.controller;

import com.daypoo.api.dto.AdminItemCreateRequest;
import com.daypoo.api.dto.AdminItemUpdateRequest;
import com.daypoo.api.dto.ItemResponse;
import com.daypoo.api.entity.enums.ItemType;
import com.daypoo.api.service.AdminManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Shop", description = "관리자 전용 상점 아이템 관리 API")
@RestController
@RequestMapping("/api/v1/admin/shop/items")
@RequiredArgsConstructor
public class AdminShopController {

  private final AdminManagementService adminManagementService;

  @Operation(summary = "아이템 리스트 통합 검색 및 필터링", description = "상점에서 판매 중인 아이템의 전체 목록을 페이징 조회합니다.")
  @GetMapping
  public ResponseEntity<Page<ItemResponse>> getItems(
      @RequestParam(required = false) ItemType type,
      @RequestParam(required = false) String search,
      @PageableDefault(size = 20) Pageable pageable) {
    return ResponseEntity.ok(adminManagementService.getItems(type, search, pageable));
  }

  @Operation(summary = "신규 아이템 생성", description = "이름, 설명, 타입, 가격, 이미지 정보를 기반으로 신규 아이템을 등록합니다.")
  @PostMapping
  public ResponseEntity<ItemResponse> createItem(
      @Valid @RequestBody AdminItemCreateRequest request) {
    return ResponseEntity.ok(adminManagementService.createItem(request));
  }

  @Operation(summary = "아이템 상세 정보 수정", description = "특정 아이템의 정보를 수정합니다.")
  @PutMapping("/{id}")
  public ResponseEntity<ItemResponse> updateItem(
      @PathVariable Long id, @Valid @RequestBody AdminItemUpdateRequest request) {
    return ResponseEntity.ok(adminManagementService.updateItem(id, request));
  }

  @Operation(
      summary = "아이템 삭제",
      description = "지정한 아이템을 삭제합니다 (해당 아이템을 보유 중인 유저가 있는 경우 삭제할 수 없습니다).")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
    adminManagementService.deleteItem(id);
    return ResponseEntity.ok().build();
  }

  @Operation(summary = "미공개 아이템 전체 동기화(공개)", description = "공개되지 않은 모든 아이템을 상점에 공개합니다.")
  @PostMapping("/publish-all")
  public ResponseEntity<java.util.Map<String, Object>> publishAllItems() {
    int count = adminManagementService.publishAllItems();
    return ResponseEntity.ok(java.util.Map.of("publishedCount", count));
  }

  @Operation(summary = "아이템 공개/비공개 토글", description = "특정 아이템의 공개 상태를 토글합니다.")
  @PutMapping("/{id}/toggle-publish")
  public ResponseEntity<ItemResponse> togglePublishItem(@PathVariable Long id) {
    return ResponseEntity.ok(adminManagementService.togglePublishItem(id));
  }
}
