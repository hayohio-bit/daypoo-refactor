package com.daypoo.api.service;

import com.daypoo.api.dto.AdminUserDetailResponse;
import com.daypoo.api.dto.AdminUserListResponse;
import com.daypoo.api.entity.Subscription;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.entity.enums.SubscriptionPlan;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.PaymentRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자 전용 유저 조회·권한 변경·삭제 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

  private final UserRepository userRepository;
  private final PaymentRepository paymentRepository;
  private final PooRecordRepository pooRecordRepository;
  private final UserDeletionService userDeletionService;

  @Transactional(readOnly = true)
  public Page<AdminUserListResponse> getUsers(
      String search, Role role, SubscriptionPlan plan, Pageable pageable) {
    Specification<User> spec =
        (root, query, cb) -> {
          List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

          // 1. 키워드 검색 (이메일 또는 닉네임)
          if (search != null && !search.isBlank()) {
            predicates.add(
                cb.or(
                    cb.like(root.get("email"), "%" + search + "%"),
                    cb.like(root.get("nickname"), "%" + search + "%")));
          }

          // 2. 역할 필터
          if (role != null) {
            predicates.add(cb.equal(root.get("role"), role));
          }

          // 3. 구독 플랜 필터
          if (plan != null) {
            if (plan == com.daypoo.api.entity.enums.SubscriptionPlan.BASIC) {
              // '미구독(BASIC)' 유저: 활성화(ACTIVE)된 PRO나 PREMIUM 구독이 없는 경우
              jakarta.persistence.criteria.Subquery<Long> subquery = query.subquery(Long.class);
              jakarta.persistence.criteria.Root<Subscription> subRoot =
                  subquery.from(Subscription.class);
              subquery.select(cb.literal(1L));
              subquery.where(
                  cb.equal(subRoot.get("user"), root),
                  cb.equal(
                      subRoot.get("status"), com.daypoo.api.entity.enums.SubscriptionStatus.ACTIVE),
                  cb.greaterThan(subRoot.get("endDate"), java.time.LocalDateTime.now()),
                  subRoot
                      .get("plan")
                      .in(
                          com.daypoo.api.entity.enums.SubscriptionPlan.PRO,
                          com.daypoo.api.entity.enums.SubscriptionPlan.PREMIUM));
              predicates.add(cb.not(cb.exists(subquery)));
            } else {
              // 특정 활성 유료 구독(PRO 또는 PREMIUM)이 있는 유저
              jakarta.persistence.criteria.Join<User, Subscription> subJoin =
                  root.join("subscriptions");
              predicates.add(cb.equal(subJoin.get("plan"), plan));
              predicates.add(
                  cb.equal(
                      subJoin.get("status"),
                      com.daypoo.api.entity.enums.SubscriptionStatus.ACTIVE));
              predicates.add(cb.greaterThan(subJoin.get("endDate"), java.time.LocalDateTime.now()));
            }
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

    return userRepository
        .findAll(spec, pageable)
        .map(
            user ->
                AdminUserListResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .nickname(user.getNickname())
                    .role(user.getRole())
                    .plan(
                        user.getActiveSubscription() != null
                            ? user.getActiveSubscription().getPlan()
                            : SubscriptionPlan.BASIC)
                    .level(user.getLevel())
                    .points(user.getPoints())
                    .recordCount((int) pooRecordRepository.countByUserId(user.getId()))
                    .createdAt(user.getCreatedAt())
                    .build());
  }

  @Transactional(readOnly = true)
  public AdminUserDetailResponse getUserDetail(Long userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_USER_NOT_FOUND));

    long paymentCount = paymentRepository.countByUserId(userId);
    Long totalAmount = paymentRepository.sumAmountByUserId(userId);

    return AdminUserDetailResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole())
        .plan(
            user.getActiveSubscription() != null
                ? user.getActiveSubscription().getPlan()
                : SubscriptionPlan.BASIC)
        .level(user.getLevel())
        .exp(user.getExp())
        .points(user.getPoints())
        .recordCount(user.getRecords().size())
        .paymentCount(paymentCount)
        .totalPaymentAmount(totalAmount != null ? totalAmount : 0L)
        .createdAt(user.getCreatedAt())
        .updatedAt(user.getUpdatedAt())
        .build();
  }

  @Transactional
  public void updateUserRole(Long userId, Role role, String currentAdminEmail) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_USER_NOT_FOUND));

    if (user.getEmail().equals(currentAdminEmail)) {
      throw new BusinessException(ErrorCode.ADMIN_CANNOT_CHANGE_OWN_ROLE);
    }

    user.updateRole(role);
  }

  @Transactional
  public void deleteUser(Long userId, String currentAdminEmail) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_USER_NOT_FOUND));

    // 본인 삭제 방지
    if (user.getEmail().equals(currentAdminEmail)) {
      throw new BusinessException(ErrorCode.ADMIN_CANNOT_DELETE_SELF);
    }

    // 물리적 삭제 (FK 의존성 순서에 맞춰 연관 데이터와 함께 삭제)
    userDeletionService.deleteUserAndRelatedData(user);
    log.info("Admin deleted user: userId={}, email={}", userId, user.getEmail());
  }
}
