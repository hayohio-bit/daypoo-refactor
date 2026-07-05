package com.daypoo.api.controller;

import com.daypoo.api.dto.SubscriptionResponse;
import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.service.SubscriptionService;
import com.daypoo.api.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Subscription", description = "구독 관리 API")
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

  private final SubscriptionService subscriptionService;
  private final UserService userService;

  /** 내 활성 구독 조회 */
  @Operation(summary = "내 활성 구독 조회", description = "현재 활성화된 구독 정보를 조회합니다.")
  @GetMapping("/me")
  public ResponseEntity<SubscriptionResponse> getMySubscription(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    Subscription subscription =
        subscriptionService
            .getActiveSubscription(user)
            .orElseThrow(() -> new BusinessException(ErrorCode.SUBSCRIPTION_NOT_FOUND));

    return ResponseEntity.ok(SubscriptionResponse.from(subscription));
  }

  /** 구독 취소 */
  @Operation(summary = "구독 취소", description = "현재 구독을 취소합니다. 만료일까지는 사용 가능합니다.")
  @PostMapping("/cancel")
  public ResponseEntity<String> cancelSubscription(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    subscriptionService.cancelSubscription(user);
    return ResponseEntity.ok("구독이 취소되었습니다. 만료일까지 사용 가능합니다.");
  }

  /** 자동 갱신 토글 */
  @Operation(summary = "자동 갱신 설정", description = "자동 갱신을 활성화/비활성화합니다.")
  @PatchMapping("/auto-renewal")
  public ResponseEntity<String> toggleAutoRenewal(
      @AuthenticationPrincipal String email, @RequestParam boolean enable) {
    User user = userService.getByEmail(email);
    subscriptionService.toggleAutoRenewal(user, enable);
    return ResponseEntity.ok(enable ? "자동 갱신이 활성화되었습니다." : "자동 갱신이 비활성화되었습니다.");
  }

  /** 구독 히스토리 조회 */
  @Operation(summary = "구독 히스토리", description = "과거 구독 내역을 포함한 전체 히스토리를 조회합니다.")
  @GetMapping("/history")
  public ResponseEntity<List<SubscriptionResponse>> getSubscriptionHistory(
      @AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    List<Subscription> history = subscriptionService.getSubscriptionHistory(user);

    return ResponseEntity.ok(history.stream().map(SubscriptionResponse::from).toList());
  }
}
