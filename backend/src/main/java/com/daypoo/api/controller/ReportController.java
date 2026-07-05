package com.daypoo.api.controller;

import com.daypoo.api.dto.HealthReportHistoryResponse;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.dto.VisitLogResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ReportType;
import com.daypoo.api.service.ReportService;
import com.daypoo.api.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Report", description = "AI 건강 리포트 및 방문 로그 API")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

  private final ReportService reportService;
  private final UserService userService;

  /** AI 건강 리포트 조회/생성 */
  @Operation(
      summary = "AI 리포트 생성/조회",
      description = "타입별(DAILY, WEEKLY, MONTHLY) AI 건강 분석 리포트를 생성하거나 조회합니다.")
  @GetMapping("/{type}")
  public ResponseEntity<HealthReportResponse> getReport(
      @AuthenticationPrincipal String email, @PathVariable ReportType type) {
    User user = userService.getByEmail(email);
    return ResponseEntity.ok(reportService.generateReport(user, type));
  }

  /** 리포트 히스토리 조회 (PRO/PREMIUM 전용) */
  @Operation(summary = "리포트 히스토리 조회", description = "사용자의 과거 AI 건강 리포트 내역을 조회합니다.")
  @GetMapping("/history")
  public ResponseEntity<List<HealthReportHistoryResponse>> getReportHistory(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    if (!user.isPro()) {
      throw new IllegalStateException("PRO 멤버십 전용 기능입니다.");
    }
    return ResponseEntity.ok(reportService.getReportHistory(user));
  }

  /** 건강 점수 트렌드 조회 (PRO/PREMIUM 전용) */
  @Operation(summary = "건강 점수 트렌드 조회", description = "최근 생성된 리포트들의 건강 점수 추이를 조회합니다.")
  @GetMapping("/trend")
  public ResponseEntity<List<Integer>> getHealthTrend(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    if (!user.isPro()) {
      throw new IllegalStateException("PRO 멤버십 전용 기능입니다.");
    }
    return ResponseEntity.ok(reportService.getHealthTrend(user));
  }

  /** 방문 패턴 데이터 조회 (PRO/PREMIUM 전용) */
  @Operation(summary = "방문 패턴 데이터 조회", description = "사용자의 화장실 방문 및 인증 로그 히스토리를 조회합니다.")
  @GetMapping("/patterns")
  public ResponseEntity<List<VisitLogResponse>> getVisitPatterns(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    if (!user.isPro()) {
      throw new IllegalStateException("PRO 멤버십 전용 기능입니다.");
    }
    return ResponseEntity.ok(reportService.getVisitPatterns(user));
  }
}
