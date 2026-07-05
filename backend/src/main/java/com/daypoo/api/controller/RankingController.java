package com.daypoo.api.controller;

import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Ranking", description = "게이미피케이션 및 랭킹 조회 API")
@RestController
@RequestMapping("/api/v1/rankings")
@RequiredArgsConstructor
public class RankingController {

  private final RankingService rankingService;
  private final UserRepository userRepository;

  /** 전체 랭킹 조회 */
  @Operation(summary = "전국 전체 랭킹 조회", description = "전국 사용자를 대상으로 한 통합 랭킹 상위권 목록과 나의 랭킹을 조회합니다.")
  @GetMapping("/global")
  public ResponseEntity<RankingResponse> getGlobalRanking(@AuthenticationPrincipal String email) {
    User user =
        (email != null && !"anonymousUser".equals(email))
            ? userRepository.findByEmail(email).orElse(null)
            : null;
    return ResponseEntity.ok(rankingService.getGlobalRanking(user));
  }

  /** 지역 랭킹 조회 */
  @Operation(
      summary = "지역별 랭킹 조회",
      description = "특정 지역(예: '서울특별시 강남구') 내의 사용자 랭킹 상위권 목록과 나의 랭킹을 조회합니다.")
  @GetMapping("/region")
  public ResponseEntity<RankingResponse> getRegionRanking(
      @AuthenticationPrincipal String email, @RequestParam String regionName) {
    User user =
        (email != null && !"anonymousUser".equals(email))
            ? userRepository.findByEmail(email).orElse(null)
            : null;
    return ResponseEntity.ok(rankingService.getRegionRanking(user, regionName));
  }

  /** 건강왕 랭킹 조회 */
  @Operation(
      summary = "건강왕(장 컨디션) 랭킹 조회",
      description = "당일 AI 분석을 통해 가장 높은 장 컨디션 점수를 기록한 건강왕 랭킹 상위권 목록을 조회합니다.")
  @GetMapping("/health")
  public ResponseEntity<RankingResponse> getHealthRanking(@AuthenticationPrincipal String email) {
    User user =
        (email != null && !"anonymousUser".equals(email))
            ? userRepository.findByEmail(email).orElse(null)
            : null;
    return ResponseEntity.ok(rankingService.getHealthRanking(user));
  }
}
