package com.daypoo.api.dto;

import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.enums.BillingCycle;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record SubscriptionResponse(
    Long id,
    SubscriptionPlan plan,
    String planDisplayName,
    SubscriptionStatus status,
    BillingCycle billingCycle,
    LocalDateTime startDate,
    LocalDateTime endDate,
    boolean isAutoRenewal,
    boolean isActive,
    Long daysRemaining) {

  public static SubscriptionResponse from(Subscription subscription) {
    if (subscription == null) return null;

    Long daysRemaining = null;
    if (subscription.getEndDate() != null) {
      daysRemaining =
          java.time.Duration.between(LocalDateTime.now(), subscription.getEndDate()).toDays();
    }

    return SubscriptionResponse.builder()
        .id(subscription.getId())
        .plan(subscription.getPlan())
        .planDisplayName(subscription.getPlan().getDisplayName())
        .status(subscription.getStatus())
        .billingCycle(subscription.getBillingCycle())
        .startDate(subscription.getStartDate())
        .endDate(subscription.getEndDate())
        .isAutoRenewal(subscription.isAutoRenewal())
        .isActive(subscription.isActive())
        .daysRemaining(daysRemaining)
        .build();
  }
}
