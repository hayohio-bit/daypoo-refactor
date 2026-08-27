package com.daypoo.api.service;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 회원 탈퇴 및 삭제 처리를 위한 전담 서비스 (FK 의존성 관리) */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDeletionService {

  private final UserRepository userRepository;
  private final PooRecordRepository pooRecordRepository;
  private final VisitLogRepository visitLogRepository;
  private final NotificationRepository notificationRepository;
  private final InventoryRepository inventoryRepository;
  private final UserTitleRepository userTitleRepository;
  private final InquiryRepository inquiryRepository;
  private final ToiletReviewRepository toiletReviewRepository;
  private final ToiletRepository toiletRepository;
  private final FavoriteRepository favoriteRepository;
  private final HealthReportSnapshotRepository healthReportSnapshotRepository;
  private final JdbcTemplate jdbcTemplate;

  /** 회원과 연관된 모든 데이터를 FK 의존성 순서에 맞춰 삭제 후 최종적으로 회원 삭제 */
  @Transactional
  public void deleteUserAndRelatedData(User user) {
    Long userId = user.getId();
    log.info("Starting deletion of user: {}", userId);

    // 1. 순수 하위 엔티티 (참조하는 대상이 적은 데이터부터 삭제)
    healthReportSnapshotRepository.deleteAllByUser(user);
    notificationRepository.deleteAllByUser(user);
    inventoryRepository.deleteAllByUser(user);
    userTitleRepository.deleteAllByUser(user);
    inquiryRepository.deleteAllByUser(user);
    // 리뷰 삭제 전 영향받을 화장실 목록 수집
    List<Toilet> affectedToilets = toiletReviewRepository.findDistinctToiletsByUser(user);

    toiletReviewRepository.deleteAllByUser(user);

    // 리뷰 삭제 후 각 화장실 통계 재계산 및 aiSummary 초기화
    for (Toilet toilet : affectedToilets) {
      long count = toiletReviewRepository.countByToiletId(toilet.getId());
      Double avg = toiletReviewRepository.calculateAvgRatingByToiletId(toilet.getId());
      toilet.updateReviewStats(avg != null ? avg : 0.0, (int) count);
      if (count < 5) {
        toilet.updateAiSummary(null);
      }
      toiletRepository.save(toilet);
    }

    favoriteRepository.deleteAllByUser(user);

    // 2. 상호 참조 및 복합 FK 관계 처리
    // VisitLog는 PooRecord를 참조하므로 먼저 삭제
    visitLogRepository.deleteAllByUser(user);

    // 결제 기능 제거 후에도 과거 데이터가 남은 DB가 있을 수 있어, users FK 정합성을 위해
    // subscriptions(payments 참조) → payments 순서로 잔여 행을 직접 삭제한다
    jdbcTemplate.update("DELETE FROM subscriptions WHERE user_id = ?", userId);
    jdbcTemplate.update("DELETE FROM payments WHERE user_id = ?", userId);

    // 3. 2단계 삭제 완료 후 안전하게 삭제 가능한 엔티티
    pooRecordRepository.deleteAllByUser(user);

    // 4. 최종적으로 유저 삭제
    userRepository.delete(user);

    log.info("Successfully deleted user: {} and all related data", userId);
  }
}
