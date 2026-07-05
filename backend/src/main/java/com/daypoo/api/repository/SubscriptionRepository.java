package com.daypoo.api.repository;

import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.SubscriptionStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

  /** 사용자의 모든 구독 조회 (최신순) */
  List<Subscription> findAllByUserOrderByCreatedAtDesc(User user);

  /** 사용자의 활성 구독 조회 */
  @Query(
      "SELECT s FROM Subscription s "
          + "WHERE s.user = :user "
          + "AND s.status = :status "
          + "AND s.endDate > :now")
  Optional<Subscription> findActiveSubscription(
      @Param("user") User user,
      @Param("status") SubscriptionStatus status,
      @Param("now") LocalDateTime now);

  /** 만료된 구독 조회 (배치 작업용) */
  @Query("SELECT s FROM Subscription s " + "WHERE s.status = 'ACTIVE' " + "AND s.endDate < :now")
  List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);

  /** 자동 갱신 대상 구독 조회 (배치 작업용) */
  @Query(
      "SELECT s FROM Subscription s "
          + "WHERE s.status = 'ACTIVE' "
          + "AND s.isAutoRenewal = true "
          + "AND s.endDate BETWEEN :start AND :end")
  List<Subscription> findSubscriptionsForRenewal(
      @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

  /** 사용자의 구독 히스토리 개수 */
  long countByUser(User user);

  /** 특정 상태의 전체 구독 수 (통계용) */
  long countByStatus(SubscriptionStatus status);

  /** 현재 활성 상태인 유효 구독 수 (정밀 통계용) */
  @Query(
      "SELECT COUNT(DISTINCT s.user) FROM Subscription s "
          + "WHERE s.status = 'ACTIVE' "
          + "AND s.endDate > :now")
  long countActiveSubscriptions(@Param("now") LocalDateTime now);

  /** 특정 유저의 모든 구독 삭제 (회원 탈퇴용) */
  void deleteAllByUser(User user);
}
