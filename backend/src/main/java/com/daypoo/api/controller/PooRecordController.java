package com.daypoo.api.controller;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.PooAnalysisRequest;
import com.daypoo.api.dto.PooCheckInRequest;
import com.daypoo.api.dto.PooCheckInResponse;
import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.service.PooRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Poo Records", description = "배변 기록 및 인증 API")
@RestController
@RequestMapping("/api/v1/records")
@RequiredArgsConstructor
public class PooRecordController {

  private final PooRecordService recordService;

  @Operation(
      summary = "화장실 도착 체크인 / Fast Check-in",
      description = "화장실 반경 내에 도착했음을 기록하고 남은 대기 시간을 반환합니다. 다중 요청 시 최초 도착 시간으로 계산됩니다.")
  @ApiResponse(responseCode = "200", description = "체크인 성공 및 대기 시간 반환")
  @PostMapping("/check-in")
  public ResponseEntity<PooCheckInResponse> checkIn(
      Authentication authentication, @Valid @RequestBody PooCheckInRequest request) {

    String email = authentication.getName();
    PooCheckInResponse response =
        recordService.checkIn(
            email,
            request.toiletId(),
            request.latitude(),
            request.longitude(),
            request.enteredAt());
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "배변 기록 생성",
      description = "화장실 방문 인증 및 배변 상태를 기록합니다. 위치 검증 및 AI 분석 연동이 포함됩니다.")
  @ApiResponse(responseCode = "200", description = "기록 생성 및 보상 지급 완료")
  @ApiResponse(responseCode = "400", description = "위치 검증 실패 또는 어뷰징 감지")
  @PostMapping
  public ResponseEntity<PooRecordResponse> createRecord(
      Authentication authentication, @Valid @RequestBody PooRecordCreateRequest request) {

    // 로그인된 유저의 email 추출
    String email = authentication.getName();

    PooRecordResponse response = recordService.createRecord(email, request);
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "AI 배변 이미지 분석 (미리보기용)",
      description = "배변 이미지를 AI 서비스에 전송하여 분석 결과를 반환합니다. 이 요청은 기록을 생성하지 않습니다.")
  @ApiResponse(responseCode = "200", description = "분석 완료")
  @PostMapping("/analyze")
  public ResponseEntity<AiAnalysisResponse> analyzeImage(
      @Valid @RequestBody PooAnalysisRequest request) {
    return ResponseEntity.ok(recordService.analyzeImageOnly(request.imageBase64()));
  }

  @Operation(
      summary = "내 배변 기록 목록 조회",
      description = "현재 로그인한 사용자의 모든 배변 기록을 최신순으로 조회합니다. (페이징 지원)")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<Page<PooRecordResponse>> getMyRecords(
      Authentication authentication, Pageable pageable) {
    String email = authentication.getName();
    return ResponseEntity.ok(recordService.getMyRecords(email, pageable));
  }

  @Operation(summary = "내 화장실별 인증 횟수 조회", description = "현재 로그인한 사용자의 화장실별 방문 인증 횟수를 반환합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/my-visit-counts")
  public ResponseEntity<Map<Long, Long>> getMyVisitCounts(Authentication authentication) {
    String email = authentication.getName();
    return ResponseEntity.ok(recordService.getMyVisitCounts(email));
  }

  @Operation(summary = "배변 기록 상세 조회", description = "특정 배변 기록의 상세 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "기록을 찾을 수 없음")
  @GetMapping("/{id}")
  public ResponseEntity<PooRecordResponse> getRecord(
      Authentication authentication, @PathVariable("id") Long id) {
    String email = authentication.getName();
    return ResponseEntity.ok(recordService.getRecord(email, id));
  }
}
