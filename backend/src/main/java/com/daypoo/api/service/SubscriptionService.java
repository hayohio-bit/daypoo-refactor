package com.daypoo.api.service;

import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.SubscriptionRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

  private final SubscriptionRepository subscriptionRepository;

  /**
   * 새 구독 생성
   *
   * @param user 사용자
   * @param plan 구독 플랜
   * @param billingCycle 결제 주기
   * @param payment 결제 정보
   * @return 생성된 구독
   */
  public Subscription createSubscription(
      User user, SubscriptionPlan plan, BillingCycle billingCycle, Payment payment) {

    // 기존 활성 구독이 있으면 취소
    getActiveSubscription(user)
        .ifPresent(
            existingSub -> {
              log.info("기존 구독 취소: userId={}, plan={}", user.getId(), existingSub.getPlan());
              existingSub.cancel();
            });

    // 새 구독 생성
    LocalDateTime startDate = LocalDateTime.now();
    LocalDateTime endDate = billingCycle.calculateEndDate(startDate);

    Subscription subscription =
        Subscription.builder()
            .user(user)
            .plan(plan)
            .startDate(startDate)
            .endDate(endDate)
            .status(SubscriptionStatus.ACTIVE)
            .billingCycle(billingCycle)
            .isAutoRenewal(true)
            .lastPayment(payment)
            .build();

    subscriptionRepository.save(subscription);
    log.info("새 구독 생성: userId={}, plan={}, endDate={}", user.getId(), plan, endDate);

    return subscription;
  }

  /**
   * 사용자의 활성 구독 조회
   *
   * @param user 사용자
   * @return 활성 구독 (Optional)
   */
  @Transactional(readOnly = true)
  public java.util.Optional<Subscription> getActiveSubscription(User user) {
    return subscriptionRepository.findActiveSubscription(
        user, SubscriptionStatus.ACTIVE, LocalDateTime.now());
  }

  /**
   * 구독 취소
   *
   * @param user 사용자
   */
  public void cancelSubscription(User user) {
    Subscription subscription =
        getActiveSubscription(user)
            .orElseThrow(() -> new BusinessException(ErrorCode.SUBSCRIPTION_NOT_FOUND));

    subscription.cancel();
    log.info("구독 취소: userId={}, plan={}", user.getId(), subscription.getPlan());
  }

  /**
   * 자동 갱신 토글
   *
   * @param user 사용자
   * @param enable true면 활성화, false면 비활성화
   */
  public void toggleAutoRenewal(User user, boolean enable) {
    Subscription subscription =
        getActiveSubscription(user)
            .orElseThrow(() -> new BusinessException(ErrorCode.SUBSCRIPTION_NOT_FOUND));

    if (enable) {
      subscription.enableAutoRenewal();
    } else {
      subscription.disableAutoRenewal();
    }

    log.info("자동 갱신 변경: userId={}, autoRenewal={}", user.getId(), subscription.isAutoRenewal());
  }

  /**
   * 구독 갱신
   *
   * @param subscription 갱신할 구독
   * @param payment 새 결제 정보
   */
  public void renewSubscription(Subscription subscription, Payment payment) {
    LocalDateTime newEndDate = subscription.getBillingCycle().calculateEndDate(LocalDateTime.now());
    subscription.renew(newEndDate, payment);

    log.info(
        "구독 갱신: userId={}, plan={}, newEndDate={}",
        subscription.getUser().getId(),
        subscription.getPlan(),
        newEndDate);
  }

  /**
   * 만료된 구독 처리 (배치 작업용)
   *
   * @return 처리된 구독 수
   */
  public int expireOverdueSubscriptions() {
    List<Subscription> expiredSubs =
        subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());

    expiredSubs.forEach(Subscription::expire);

    log.info("만료 처리 완료: count={}", expiredSubs.size());
    return expiredSubs.size();
  }

  /**
   * 사용자의 전체 구독 히스토리 조회
   *
   * @param user 사용자
   * @return 구독 목록
   */
  @Transactional(readOnly = true)
  public List<Subscription> getSubscriptionHistory(User user) {
    return subscriptionRepository.findAllByUserOrderByCreatedAtDesc(user);
  }
}
