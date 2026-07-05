package com.daypoo.api.controller;

import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.service.HealthReportService;
import com.daypoo.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health/reports")
@RequiredArgsConstructor
public class HealthReportController {

  private final HealthReportService reportService;
  private final UserService userService;

  @GetMapping("/weekly")
  public ResponseEntity<HealthReportResponse> getWeeklyReport(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);

    return ResponseEntity.ok(reportService.getWeeklyReport(user));
  }
}
