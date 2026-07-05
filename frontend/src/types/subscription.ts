/**
 * 구독 플랜 타입
 */
export type SubscriptionPlan = 'BASIC' | 'PRO' | 'PREMIUM';

/**
 * 구독 상태 타입
 */
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

/**
 * 결제 주기 타입
 */
export type BillingCycle = 'MONTHLY' | 'YEARLY';

/**
 * 구독 정보 응답
 */
export interface SubscriptionResponse {
  id: number;
  plan: SubscriptionPlan;
  planDisplayName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  isAutoRenewal: boolean;
  isActive: boolean;
  daysRemaining: number | null;
}
