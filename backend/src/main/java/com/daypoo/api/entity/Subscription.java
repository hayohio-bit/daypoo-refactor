package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subscriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subscription extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private SubscriptionPlan plan; // BASIC, PRO, PREMIUM

  @Column(name = "start_date", nullable = false)
  private LocalDateTime startDate;

  @Column(name = "end_date")
  private LocalDateTime endDate;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private SubscriptionStatus status; // ACTIVE, CANCELLED, EXPIRED

  @Column(name = "billing_cycle")
  @Enumerated(EnumType.STRING)
  private BillingCycle billingCycle; // MONTHLY, YEARLY

  @Column(name = "is_auto_renewal", nullable = false)
  private boolean isAutoRenewal = true;

  // 최근 결제 참조 (선택사항)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "last_payment_id")
  private Payment lastPayment;

  @Builder
  public Subscription(
      User user,
      SubscriptionPlan plan,
      LocalDateTime startDate,
      LocalDateTime endDate,
      SubscriptionStatus status,
      BillingCycle billingCycle,
      boolean isAutoRenewal,
      Payment lastPayment) {
    this.user = user;
    this.plan = plan;
    this.startDate = startDate;
    this.endDate = endDate;
    this.status = status;
    this.billingCycle = billingCycle;
    this.isAutoRenewal = isAutoRenewal;
    this.lastPayment = lastPayment;
  }

  // === 비즈니스 로직 ===

  /** 구독 활성화 */
  public void activate(LocalDateTime newEndDate) {
    this.status = SubscriptionStatus.ACTIVE;
    this.endDate = newEndDate;
  }

  /** 구독 취소 */
  public void cancel() {
    this.status = SubscriptionStatus.CANCELLED;
    this.isAutoRenewal = false;
  }

  /** 구독 만료 */
  public void expire() {
    this.status = SubscriptionStatus.EXPIRED;
  }

  /** 구독 갱신 */
  public void renew(LocalDateTime newEndDate, Payment payment) {
    this.startDate = LocalDateTime.now();
    this.endDate = newEndDate;
    this.status = SubscriptionStatus.ACTIVE;
    this.lastPayment = payment;
  }

  /** 활성 구독 여부 확인 */
  public boolean isActive() {
    return status == SubscriptionStatus.ACTIVE
        && endDate != null
        && endDate.isAfter(LocalDateTime.now());
  }

  /** 자동 갱신 비활성화 */
  public void disableAutoRenewal() {
    this.isAutoRenewal = false;
  }

  /** 자동 갱신 활성화 */
  public void enableAutoRenewal() {
    this.isAutoRenewal = true;
  }
}
