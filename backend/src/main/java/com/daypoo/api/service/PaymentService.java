package com.daypoo.api.service;

import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class PaymentService {
  private final UserService userService;
  private final PaymentRepository paymentRepository;
  private final SubscriptionService subscriptionService;
  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate;
  private final SystemLogService systemLogService;

  public PaymentService(
      UserService userService,
      PaymentRepository paymentRepository,
      SubscriptionService subscriptionService,
      ObjectMapper objectMapper,
      @Qualifier("externalRestTemplate") RestTemplate restTemplate,
      SystemLogService systemLogService) {
    this.userService = userService;
    this.paymentRepository = paymentRepository;
    this.subscriptionService = subscriptionService;
    this.objectMapper = objectMapper;
    this.restTemplate = restTemplate;
    this.systemLogService = systemLogService;
  }

  @Value("${toss.secret-key}")
  private String secretKey;

  private static final String TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

  @Transactional
  public void confirmPayment(String email, String paymentKey, String orderId, Long amount) {
    log.info("Processing Payment: orderId={}, amount={}, user={}", orderId, amount, email);

    User user = userService.getByEmail(email);

    try {
      HttpHeaders headers = new HttpHeaders();
      String encodedKey =
          Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
      headers.set("Authorization", "Basic " + encodedKey);
      headers.setContentType(MediaType.APPLICATION_JSON);

      Map<String, Object> payload = new HashMap<>();
      payload.put("paymentKey", paymentKey);
      payload.put("orderId", orderId);
      payload.put("amount", amount);

      HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

      restTemplate.postForEntity(TOSS_CONFIRM_URL, request, JsonNode.class);

      // 결제 내역 저장
      Payment savedPayment =
          paymentRepository.save(
              Payment.builder()
                  .email(email)
                  .user(user)
                  .orderId(orderId)
                  .amount(amount)
                  .paymentKey(paymentKey)
                  .build());

      handleMembershipOrPoints(user, savedPayment);
      systemLogService.info(
          "Payment",
          "Payment confirmed: orderId=" + orderId + ", amount=" + amount + ", user=" + email);
      log.info("✅ Payment confirmed, recorded, and membership/points updated for user: {}", email);

    } catch (HttpClientErrorException e) {
      systemLogService.error(
          "Payment", "Toss payment failed: orderId=" + orderId + ", user=" + email);
      handleTossError(e);
    } catch (Exception e) {
      systemLogService.error("Payment", "Unexpected payment error: " + e.getMessage());
      log.error("❌ Unexpected Payment Error: {}", e.getMessage());
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private void handleTossError(HttpClientErrorException e) {
    try {
      JsonNode errorNode = objectMapper.readTree(e.getResponseBodyAsString());
      String code = errorNode.get("code").asText();
      String message = errorNode.get("message").asText();
      log.error("❌ Toss Payment Error: {} - {}", code, message);
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
    } catch (Exception ex) {
      log.error("❌ Failed to parse Toss error response: {}", e.getResponseBodyAsString());
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private void handleMembershipOrPoints(User user, Payment payment) {
    String orderId = payment.getOrderId();
    Long amount = payment.getAmount();

    // orderId 또는 amount로 구독 플랜 판단
    SubscriptionPlan plan = determinePlanFromOrderId(orderId, amount);

    // 구독 생성 (PRO, PREMIUM만)
    if (plan != SubscriptionPlan.BASIC) {
      subscriptionService.createSubscription(
          user,
          plan,
          BillingCycle.MONTHLY, // 기본 월간 구독
          payment);

      log.info("✅ Subscription created: userId={}, plan={}", user.getId(), plan);
    } else {
      addPointsToUser(user, amount);
    }
  }

  /** orderId 또는 amount로 구독 플랜 판단 */
  private SubscriptionPlan determinePlanFromOrderId(String orderId, Long amount) {
    if (orderId != null) {
      if (orderId.toUpperCase().contains("PRO")) {
        return SubscriptionPlan.PRO;
      } else if (orderId.toUpperCase().contains("PREMIUM")) {
        return SubscriptionPlan.PREMIUM;
      }
    }
    return SubscriptionPlan.fromAmount(amount);
  }

  private void addPointsToUser(User user, Long amount) {
    if (user == null) return;
    user.addExpAndPoints(0, amount);
    userService.updateUser(user);
  }
}
