package com.daypoo.api.controller;

import com.daypoo.api.dto.AdminStatsResponse;
import com.daypoo.api.dto.SyncStatusResponse;
import com.daypoo.api.service.AdminService;
import com.daypoo.api.service.AdminSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin", description = "관리자 전용 통계 및 데이터 관리 API")
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

  private final AdminService adminService;
  private final AdminSettingsService adminSettingsService;
  private final com.daypoo.api.service.PublicDataSyncService syncService;
  private final com.daypoo.api.service.RankingService rankingService;

  @Operation(
      summary = "공공데이터 화장실 정보 동기화",
      description = "외부 API로부터 전국 공공 화장실 데이터를 수집하여 DB 및 Redis에 저장합니다. (가상 스레드 활용)")
  @PostMapping("/sync-toilets")
  public ResponseEntity<java.util.Map<String, String>> syncToilets(int startPage, int endPage) {
    if ("RUNNING".equals(syncService.getSyncStatus().status())) {
      return ResponseEntity.status(409).body(java.util.Map.of("message", "이미 동기화가 진행 중입니다."));
    }
    syncService.syncAllToiletsAsync(startPage, endPage);
    return ResponseEntity.accepted()
        .body(java.util.Map.of("message", "동기화가 시작되었습니다. 잠시 후 상태를 확인해주세요."));
  }

  @Operation(summary = "공공데이터 동기화 상태 조회", description = "비동기로 진행 중인 화장실 동기화 작업의 현재 상태를 반환합니다.")
  @GetMapping("/sync-toilets/status")
  public ResponseEntity<SyncStatusResponse> getSyncStatus() {
    return ResponseEntity.ok(syncService.getSyncStatus());
  }

  @Operation(
      summary = "관리자 대시보드 통계 조회",
      description = "유저 추이, 매출, 문의 현황 등 관리자 대시보드에 필요한 통계 정보를 반환합니다.")
  @GetMapping("/stats")
  public ResponseEntity<AdminStatsResponse> getAdminStats() {
    return ResponseEntity.ok(adminService.getAdminStats());
  }

  @Operation(summary = "테스트 데이터 생성", description = "통계 그래프 확인을 위해 과거 14일치 결제 테스트 데이터를 생성합니다.")
  @PostMapping("/generate-test-data")
  public ResponseEntity<String> generateTestData() {
    adminService.generateTestData();
    return ResponseEntity.ok("테스트 데이터가 생성되었습니다.");
  }

  @Operation(summary = "시스템 로그 조회", description = "시스템의 주요 이벤트 로그를 최신순으로 조회합니다.")
  @GetMapping("/logs")
  public ResponseEntity<java.util.List<com.daypoo.api.dto.SystemLogResponse>> getSystemLogs() {
    return ResponseEntity.ok(adminService.getSystemLogs());
  }

  @Operation(summary = "랭킹 전체 재구축", description = "Redis 랭킹 데이터를 삭제하고 DB 기반으로 재계산하여 재적재합니다.")
  @PostMapping("/rebuild-rankings")
  public ResponseEntity<String> rebuildRankings() {
    rankingService.rebuildAllRankings();
    return ResponseEntity.ok("랭킹 전체 재구축이 완료되었습니다.");
  }

  @Operation(summary = "시스템 설정 조회", description = "관리자 설정 페이지에서 사용하는 시스템 전역 설정값을 조회합니다.")
  @GetMapping("/settings")
  public ResponseEntity<com.daypoo.api.dto.SystemSettingsResponse> getSettings() {
    return ResponseEntity.ok(adminSettingsService.getSettings());
  }

  @Operation(summary = "시스템 설정 업데이트", description = "공지사항, 점검 모드, 회원가입 제한 등 시스템 설정을 업데이트합니다.")
  @org.springframework.web.bind.annotation.PutMapping("/settings")
  public ResponseEntity<com.daypoo.api.dto.SystemSettingsResponse> updateSettings(
      @org.springframework.web.bind.annotation.RequestBody
          com.daypoo.api.dto.SystemSettingsUpdateRequest request) {
    return ResponseEntity.ok(adminSettingsService.updateSettings(request));
  }
}
