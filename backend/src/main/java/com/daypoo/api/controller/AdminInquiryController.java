package com.daypoo.api.controller;

import com.daypoo.api.dto.AdminInquiryAnswerRequest;
import com.daypoo.api.dto.AdminInquiryDetailResponse;
import com.daypoo.api.dto.AdminInquiryListResponse;
import com.daypoo.api.entity.enums.InquiryStatus;
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

@Tag(name = "Admin - CS", description = "관리자 전용 고객 지원 처리 API")
@RestController
@RequestMapping("/api/v1/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

  private final AdminManagementService adminManagementService;

  @Operation(
      summary = "전체 1:1 문의 목록 조회 및 필터링",
      description = "상태별(PENDING, COMPLETED) 필터링 조회가 가능한 문의 리스트를 반환합니다.")
  @GetMapping
  public ResponseEntity<Page<AdminInquiryListResponse>> getInquiries(
      @RequestParam(required = false) InquiryStatus status,
      @RequestParam(required = false) String search,
      @PageableDefault(
              size = 20,
              sort = "createdAt",
              direction = org.springframework.data.domain.Sort.Direction.DESC)
          Pageable pageable) {
    return ResponseEntity.ok(adminManagementService.getInquiries(status, search, pageable));
  }

  @Operation(summary = "문의 상세 조회", description = "문의 내용 및 기존 답변이 포함된 상세 데이터를 조회합니다.")
  @GetMapping("/{id}")
  public ResponseEntity<AdminInquiryDetailResponse> getInquiryDetail(@PathVariable Long id) {
    return ResponseEntity.ok(adminManagementService.getInquiryDetail(id));
  }

  @Operation(summary = "문의 답변 등록", description = "대기 중인 문의에 대해 관리자 답변을 등록하고 상태를 '답변 완료'로 변경합니다.")
  @PostMapping("/{id}/answer")
  public ResponseEntity<Void> answerInquiry(
      @PathVariable Long id, @Valid @RequestBody AdminInquiryAnswerRequest request) {
    adminManagementService.answerInquiry(id, request);
    return ResponseEntity.ok().build();
  }

  @Operation(summary = "문의 테스트 데이터 생성", description = "고객지원 테스트를 위해 30개의 문의 데이터를 생성합니다.")
  @PostMapping("/generate-test-data")
  public ResponseEntity<String> generateInquiryTestData() {
    adminManagementService.generateInquiryTestData();
    return ResponseEntity.ok("30개의 문의 테스트 데이터가 생성되었습니다.");
  }
}
