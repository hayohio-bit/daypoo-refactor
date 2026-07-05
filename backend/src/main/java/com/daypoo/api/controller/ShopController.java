package com.daypoo.api.controller;

import com.daypoo.api.dto.*;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ItemType;
import com.daypoo.api.service.ShopService;
import com.daypoo.api.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shop")
@RequiredArgsConstructor
public class ShopController {

  private final ShopService shopService;
  private final UserService userService;

  /** 상점 아이템 목록 조회 */
  @GetMapping("/items")
  public ResponseEntity<List<ItemResponse>> getAllItems(
      @AuthenticationPrincipal String email, @RequestParam(required = false) ItemType type) {
    User user = userService.getByEmail(email);
    return ResponseEntity.ok(shopService.getAllItems(user, type));
  }

  /** 아이템 구매 */
  @PostMapping("/purchase")
  public ResponseEntity<Void> purchaseItem(
      @AuthenticationPrincipal String email, @RequestBody ShopPurchaseRequest request) {
    User user = userService.getByEmail(email);
    shopService.purchaseItem(user, request.itemId());
    return ResponseEntity.ok().build();
  }

  /** 내 인벤토리 조회 */
  @GetMapping("/inventory")
  public ResponseEntity<List<InventoryResponse>> getUserInventory(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    return ResponseEntity.ok(shopService.getUserInventory(user));
  }

  /** 아이템 장착/해제 토글 */
  @PostMapping("/inventory/{inventoryId}/toggle")
  public ResponseEntity<Void> toggleEquipItem(
      @AuthenticationPrincipal String email, @PathVariable Long inventoryId) {
    User user = userService.getByEmail(email);
    shopService.toggleEquipItem(user, inventoryId);
    return ResponseEntity.ok().build();
  }

  /** 전체 칭호 목록 및 유저 보유 여부 조회 */
  @GetMapping("/titles")
  public ResponseEntity<List<TitleResponse>> getAllTitles(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    return ResponseEntity.ok(shopService.getAllTitles(user));
  }

  @PostMapping("/titles/{titleId}/equip")
  public ResponseEntity<Void> equipTitle(
      @AuthenticationPrincipal String email, @PathVariable Long titleId) {
    User user = userService.getByEmail(email);
    shopService.equipTitle(user, titleId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/titles/{titleId}/acquire")
  public ResponseEntity<Void> acquireTitle(
      @AuthenticationPrincipal String email, @PathVariable Long titleId) {
    User user = userService.getByEmail(email);
    shopService.acquireTitle(user, titleId);
    return ResponseEntity.ok().build();
  }

  /** 칭호 해제 */
  @DeleteMapping("/titles/equip")
  public ResponseEntity<Void> unequipTitle(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    shopService.unequipTitle(user);
    return ResponseEntity.ok().build();
  }
}
