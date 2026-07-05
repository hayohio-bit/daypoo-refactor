package com.daypoo.api.controller;

import com.daypoo.api.dto.AdminToiletListResponse;
import com.daypoo.api.service.AdminManagementService;
import com.daypoo.api.service.ToiletIndexingService;
import com.daypoo.api.service.ToiletReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Toilet", description = "관리자 전용 화장실 데이터 관리 API")
@RestController
@RequestMapping("/api/v1/admin/toilets")
@RequiredArgsConstructor
public class AdminToiletController {

  private final AdminManagementService adminManagementService;
  private final ToiletReviewService toiletReviewService;
  private final ToiletIndexingService toiletIndexingService;

  @Operation(
      summary = "OpenSearch 인덱싱 강제 실행",
      description = "데이터베이스의 모든 화장실 데이터를 OpenSearch에 다시 인덱싱합니다.")
  @GetMapping("/reindex")
  public ResponseEntity<String> reindex() {
    toiletIndexingService.forceReindex();
    return ResponseEntity.ok(
        "Force re-indexing started in background. Check server logs for progress.");
  }

  @Operation(summary = "현재 인덱싱된 화장실 개수 조회", description = "OpenSearch에 저장된 전체 화장실 데이터 개수를 조회합니다.")
  @GetMapping("/count")
  public ResponseEntity<Long> getCount() {
    return ResponseEntity.ok(toiletIndexingService.getIndexedCount());
  }

  @Operation(summary = "전체 화장실 목록 조회 및 검색", description = "검색어(이름/주소)를 포함한 화장실 전체 리스트를 페이징 조회합니다.")
  @GetMapping
  public ResponseEntity<Page<AdminToiletListResponse>> getToilets(
      @RequestParam(required = false) String search,
      @PageableDefault(size = 20) Pageable pageable) {
    return ResponseEntity.ok(adminManagementService.getToilets(search, pageable));
  }

  @Operation(summary = "AI 리뷰 요약 일괄 생성", description = "리뷰 5개 이상이면서 AI 요약이 없는 화장실들에 대해 일괄 생성합니다.")
  @PostMapping("/ai-summaries/generate")
  public ResponseEntity<Map<String, Object>> generateAiSummaries() {
    int count = toiletReviewService.generateMissingAiSummaries();
    return ResponseEntity.ok(Map.of("generated", count));
  }
}
