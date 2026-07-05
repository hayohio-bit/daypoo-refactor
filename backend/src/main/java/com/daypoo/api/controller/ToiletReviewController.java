package com.daypoo.api.controller;

import com.daypoo.api.dto.*;
import com.daypoo.api.service.ToiletReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Toilet Reviews", description = "화장실 리뷰 관련 API")
@RestController
@RequestMapping("/api/v1/toilets")
@RequiredArgsConstructor
public class ToiletReviewController {

  private final ToiletReviewService reviewService;

  @Operation(summary = "화장실 리뷰 작성", description = "특정 화장실에 대한 평점, 이모지 태그, 코멘트를 남깁니다.")
  @ApiResponse(responseCode = "200", description = "리뷰 작성 성공")
  @PostMapping("/{toiletId}/reviews")
  public ResponseEntity<ToiletReviewResponse> createReview(
      Authentication authentication,
      @PathVariable("toiletId") Long toiletId,
      @Valid @RequestBody ToiletReviewCreateRequest request) {
    String email = authentication.getName();
    return ResponseEntity.ok(reviewService.createReview(email, toiletId, request));
  }

  @Operation(summary = "최근 리뷰 5개 조회", description = "특정 화장실의 최근 리뷰 5개를 가져옵니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/{toiletId}/reviews/recent")
  public ResponseEntity<List<ToiletReviewResponse>> getRecentReviews(
      @PathVariable("toiletId") Long toiletId) {
    return ResponseEntity.ok(reviewService.getRecentReviews(toiletId));
  }

  @Operation(
      summary = "전체 리뷰 페이징 조회",
      description = "특정 화장실의 전체 리뷰를 페이징하여 조회합니다. (latest/oldest 정렬 지원)")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/{toiletId}/reviews")
  public ResponseEntity<ToiletReviewPageResponse> getReviewsWithPaging(
      @PathVariable("toiletId") Long toiletId,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size,
      @RequestParam(name = "sort", defaultValue = "latest") String sort) {
    return ResponseEntity.ok(reviewService.getReviewsWithPaging(toiletId, page, size, sort));
  }

  @Operation(summary = "리뷰 요약 정보 조회", description = "AI 한 줄 요약을 포함한 화장실 리뷰 통계 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/{toiletId}/reviews/summary")
  public ResponseEntity<ToiletReviewSummaryResponse> getReviewSummary(
      @PathVariable("toiletId") Long toiletId) {
    return ResponseEntity.ok(reviewService.getReviewSummary(toiletId));
  }
}
