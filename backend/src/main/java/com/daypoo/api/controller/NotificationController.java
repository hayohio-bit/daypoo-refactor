package com.daypoo.api.controller;

import com.daypoo.api.dto.NotificationResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.security.JwtProvider;
import com.daypoo.api.service.NotificationService;
import com.daypoo.api.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "Notifications", description = "실시간 알림 API")
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

  private final NotificationService notificationService;
  private final UserService userService;
  private final JwtProvider jwtProvider;

  @Operation(summary = "SSE 전용 토큰 발급", description = "실시간 알림 구독을 위한 단기 토큰을 발급합니다.")
  @PostMapping("/sse-token")
  public ResponseEntity<Map<String, String>> getSseToken(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    String sseToken = jwtProvider.createSseToken(email, user.getRole().name());
    return ResponseEntity.ok(Map.of("sseToken", sseToken));
  }

  /** 실시간 알림 구독 (SSE) */
  @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  @Operation(summary = "실시간 알림 구독 (SSE)", description = "클라이언트와 서버 간의 SSE 연결을 수립합니다.")
  public ResponseEntity<SseEmitter> subscribe(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    SseEmitter emitter = notificationService.subscribe(user.getId());
    return ResponseEntity.ok()
        .header("X-Accel-Buffering", "no") // Nginx 프록시 버퍼링 비활성화
        .header("Cache-Control", "no-cache") // 캐시 비활성화
        .body(emitter);
  }

  /** 내 알림 목록 조회 */
  @GetMapping
  @Operation(summary = "알림 목록 조회", description = "최신순으로 사용자의 알림 목록을 반환합니다.")
  public ResponseEntity<List<NotificationResponse>> getNotifications(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    return ResponseEntity.ok(notificationService.getMyNotifications(user));
  }

  /** 알림 읽음 처리 */
  @PatchMapping("/{notificationId}/read")
  @Operation(summary = "알림 읽음 처리", description = "특정 알림의 읽음 상태를 true로 변경합니다.")
  public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
    notificationService.markAsRead(notificationId);
    return ResponseEntity.ok().build();
  }

  /** 모든 알림 일괄 읽음 처리 */
  @PostMapping("/mark-all-read")
  @Operation(summary = "모든 알림 일괄 읽음 처리", description = "사용자의 모든 미읽음 알림을 읽음 상태로 변경합니다.")
  public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    notificationService.markAllAsRead(user);
    return ResponseEntity.ok().build();
  }

  /** 알림 삭제 */
  @DeleteMapping("/{notificationId}")
  @Operation(summary = "알림 삭제", description = "특정 알림을 삭제합니다.")
  public ResponseEntity<Void> deleteNotification(
      @PathVariable Long notificationId, @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    notificationService.deleteNotification(notificationId, user);
    return ResponseEntity.ok().build();
  }
}
