package com.daypoo.api.controller;

import com.daypoo.api.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Payment", description = "결제 승인 및 포인트 적립 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

  private final PaymentService paymentService;

  @Operation(summary = "결제 승인", description = "토스 페이먼츠 결제 승인을 요청하고 성공 시 사용자에게 포인트를 지급합니다.")
  @PostMapping("/confirm")
  public ResponseEntity<Map<String, Object>> confirmPayment(
      @AuthenticationPrincipal String email, @RequestBody PaymentRequest request) {

    log.info(
        "Payment Confirmation Request: orderId={}, amount={}, user={}",
        request.getOrderId(),
        request.getAmount(),
        email);

    try {
      paymentService.confirmPayment(
          email, request.getPaymentKey(), request.getOrderId(), request.getAmount());

      return ResponseEntity.ok(Map.of("success", true, "message", "결제 승인 및 포인트 지급이 완료되었습니다."));
    } catch (Exception e) {
      log.error("Payment confirmation failed: {}", e.getMessage());
      return ResponseEntity.badRequest()
          .body(
              Map.of(
                  "success",
                  false,
                  "message",
                  e.getMessage() != null ? e.getMessage() : "결제 승인 처리 중 오류가 발생했습니다."));
    }
  }

  @Data
  public static class PaymentRequest {
    private String paymentKey;
    private String orderId;
    private Long amount;
  }
}
