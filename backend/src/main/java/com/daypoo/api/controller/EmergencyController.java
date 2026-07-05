package com.daypoo.api.controller;

import com.daypoo.api.dto.EmergencyToiletResponse;
import com.daypoo.api.service.EmergencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Emergency", description = "초급똥(긴급) 화장실 검색 API")
@RestController
@RequestMapping("/api/v1/toilets/emergency")
@RequiredArgsConstructor
public class EmergencyController {

  private final EmergencyService emergencyService;

  @Operation(
      summary = "초급똥 화장실 추천 (가장 가까운 3개)",
      description = "현재 위치(위도/경도)를 기준으로 즉시 도달 가능한 가장 가까운 화장실 3곳을 반환합니다.")
  @GetMapping
  public ResponseEntity<List<EmergencyToiletResponse>> searchEmergencyToilets(
      @RequestParam double latitude, @RequestParam double longitude) {

    List<EmergencyToiletResponse> top3Responses =
        emergencyService.findEmergencyToilets(latitude, longitude);
    return ResponseEntity.ok(top3Responses);
  }
}
