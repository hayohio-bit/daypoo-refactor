package com.daypoo.api.controller;

import com.daypoo.api.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Favorite", description = "즐겨찾기 관련 API")
@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

  private final FavoriteService favoriteService;

  @Operation(
      summary = "즐겨찾기 토글 (추가/삭제)",
      description = "이미 즐겨찾기 된 경우 삭제하고, 아닌 경우 추가합니다. 결과값으로 추가여부(boolean)를 반환합니다.")
  @PostMapping("/{toiletId}")
  public ResponseEntity<Boolean> toggleFavorite(
      Authentication authentication, @PathVariable("toiletId") Long toiletId) {
    boolean isAdded = favoriteService.toggleFavorite(authentication.getName(), toiletId);
    return ResponseEntity.ok(isAdded);
  }

  @Operation(summary = "즐겨찾기 화장실 ID 목록 조회", description = "로그인한 유저가 즐겨찾기한 화장실 ID들의 목록을 반환합니다.")
  @GetMapping
  public ResponseEntity<List<Long>> getFavoriteToiletIds(Authentication authentication) {
    List<Long> favoriteIds = favoriteService.getFavoriteToiletIds(authentication.getName());
    return ResponseEntity.ok(favoriteIds);
  }
}
