package com.daypoo.api.service;

import com.daypoo.api.dto.AdminUserDetailResponse;
import com.daypoo.api.dto.AdminUserListResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
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
  private final PooRecordRepository pooRecordRepository;
  private final UserDeletionService userDeletionService;

  @Transactional(readOnly = true)
  public Page<AdminUserListResponse> getUsers(String search, Role role, Pageable pageable) {
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
                    .level(user.getLevel())
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

    return AdminUserDetailResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole())
        .level(user.getLevel())
        .exp(user.getExp())
        .recordCount(user.getRecords().size())
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
