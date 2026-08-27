package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("결제 서비스 단위 테스트")
class PaymentServiceTest {

  @InjectMocks private PaymentService paymentService;

  @Mock private UserService userService;
  @Mock private PaymentRepository paymentRepository;
  @Mock private SubscriptionService subscriptionService;
  @Mock private RestTemplate restTemplate;
  @Mock private SystemLogService systemLogService;

  // 실제 ObjectMapper: Toss 에러 응답 파싱 검증에 사용
  private final ObjectMapper objectMapper = new ObjectMapper();

  private static final String EMAIL = "buyer@daypoo.com";
  private User user;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(paymentService, "objectMapper", objectMapper);
    ReflectionTestUtils.setField(paymentService, "secretKey", "test-secret");
    user =
        User.builder()
            .email(EMAIL)
            .nickname("구매자")
            .password("encoded")
            .role(Role.ROLE_USER)
            .build();
    given(userService.getByEmail(EMAIL)).willReturn(user);
  }

  private void givenTossConfirmSucceeds() {
    given(restTemplate.postForEntity(anyString(), any(), eq(JsonNode.class)))
        .willReturn(org.springframework.http.ResponseEntity.ok(null));
  }

  @Test
  @DisplayName("PRO 주문은 결제 내역을 저장하고 월간 PRO 구독을 생성한다")
  void confirmPayment_proOrder_createsSubscription() {
    givenTossConfirmSucceeds();
    Payment saved =
        Payment.builder().email(EMAIL).user(user).orderId("PRO_1").amount(4900L).build();
    given(paymentRepository.save(any(Payment.class))).willReturn(saved);

    paymentService.confirmPayment(EMAIL, "pay-key", "PRO_1", 4900L);

    verify(paymentRepository).save(any(Payment.class));
    verify(subscriptionService)
        .createSubscription(user, SubscriptionPlan.PRO, BillingCycle.MONTHLY, saved);
  }

  @Test
  @DisplayName("플랜 금액이 아닌 주문은 구독 대신 결제 금액만큼 포인트를 적립한다")
  void confirmPayment_pointOrder_addsPoints() {
    givenTossConfirmSucceeds();
    Payment saved =
        Payment.builder().email(EMAIL).user(user).orderId("POINT_1").amount(1000L).build();
    given(paymentRepository.save(any(Payment.class))).willReturn(saved);

    paymentService.confirmPayment(EMAIL, "pay-key", "POINT_1", 1000L);

    verify(subscriptionService, never()).createSubscription(any(), any(), any(), any());
    assertThat(user.getPoints()).isEqualTo(1000L);
    verify(userService).updateUser(user);
  }

  @Test
  @DisplayName("Toss 승인 API가 4xx로 실패하면 결제 내역을 저장하지 않고 BusinessException을 던진다")
  void confirmPayment_tossRejects_throwsWithoutSaving() {
    HttpClientErrorException tossError =
        HttpClientErrorException.create(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            org.springframework.http.HttpHeaders.EMPTY,
            "{\"code\":\"INVALID_CARD\",\"message\":\"유효하지 않은 카드\"}"
                .getBytes(StandardCharsets.UTF_8),
            StandardCharsets.UTF_8);
    given(restTemplate.postForEntity(anyString(), any(), eq(JsonNode.class))).willThrow(tossError);

    assertThatThrownBy(() -> paymentService.confirmPayment(EMAIL, "pay-key", "PRO_1", 4900L))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);

    verify(paymentRepository, never()).save(any());
    verify(subscriptionService, never()).createSubscription(any(), any(), any(), any());
  }

  @Test
  @DisplayName("승인 이후 저장 단계에서 예외가 나도 BusinessException으로 감싼다")
  void confirmPayment_unexpectedError_wrapsInBusinessException() {
    givenTossConfirmSucceeds();
    given(paymentRepository.save(any(Payment.class))).willThrow(new RuntimeException("DB down"));

    assertThatThrownBy(() -> paymentService.confirmPayment(EMAIL, "pay-key", "PRO_1", 4900L))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);
  }

  @Test
  @DisplayName("orderId에 플랜명이 없으면 금액으로 플랜을 판정한다 (9900원 → PREMIUM)")
  void confirmPayment_planFromAmount() {
    givenTossConfirmSucceeds();
    Payment saved =
        Payment.builder().email(EMAIL).user(user).orderId("ORDER_1").amount(9900L).build();
    given(paymentRepository.save(any(Payment.class))).willReturn(saved);

    paymentService.confirmPayment(EMAIL, "pay-key", "ORDER_1", 9900L);

    verify(subscriptionService)
        .createSubscription(user, SubscriptionPlan.PREMIUM, BillingCycle.MONTHLY, saved);
  }
}
