package com.daypoo.api.service;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.FavoriteRepository;
import com.daypoo.api.repository.HealthReportSnapshotRepository;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.InventoryRepository;
import com.daypoo.api.repository.NotificationRepository;
import com.daypoo.api.repository.PaymentRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.SubscriptionRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.ToiletReviewRepository;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.repository.UserTitleRepository;
import com.daypoo.api.repository.VisitLogRepository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("회원 삭제 서비스 단위 테스트")
class UserDeletionServiceTest {

  @InjectMocks private UserDeletionService userDeletionService;

  @Mock private UserRepository userRepository;
  @Mock private PooRecordRepository pooRecordRepository;
  @Mock private VisitLogRepository visitLogRepository;
  @Mock private NotificationRepository notificationRepository;
  @Mock private InventoryRepository inventoryRepository;
  @Mock private UserTitleRepository userTitleRepository;
  @Mock private SubscriptionRepository subscriptionRepository;
  @Mock private PaymentRepository paymentRepository;
  @Mock private InquiryRepository inquiryRepository;
  @Mock private ToiletReviewRepository toiletReviewRepository;
  @Mock private ToiletRepository toiletRepository;
  @Mock private FavoriteRepository favoriteRepository;
  @Mock private HealthReportSnapshotRepository healthReportSnapshotRepository;

  @Test
  @DisplayName("연관 데이터를 FK 의존 순서대로 모두 삭제한 뒤 마지막에 회원을 삭제한다")
  void deleteUserAndRelatedData_deletesEverythingInFkSafeOrder() {
    User user = mock(User.class);
    given(user.getId()).willReturn(1L);
    given(toiletReviewRepository.findDistinctToiletsByUser(user)).willReturn(List.of());

    userDeletionService.deleteUserAndRelatedData(user);

    // 전 리포지토리 삭제 호출 확인
    verify(healthReportSnapshotRepository).deleteAllByUser(user);
    verify(notificationRepository).deleteAllByUser(user);
    verify(inventoryRepository).deleteAllByUser(user);
    verify(userTitleRepository).deleteAllByUser(user);
    verify(inquiryRepository).deleteAllByUser(user);
    verify(toiletReviewRepository).deleteAllByUser(user);
    verify(favoriteRepository).deleteAllByUser(user);

    // FK 의존 순서: VisitLog가 PooRecord를 참조하므로 먼저 삭제되어야 한다
    InOrder visitBeforeRecord = inOrder(visitLogRepository, pooRecordRepository);
    visitBeforeRecord.verify(visitLogRepository).deleteAllByUser(user);
    visitBeforeRecord.verify(pooRecordRepository).deleteAllByUser(user);

    // Subscription이 Payment를 참조하므로 먼저 삭제되어야 한다
    InOrder subBeforePayment = inOrder(subscriptionRepository, paymentRepository);
    subBeforePayment.verify(subscriptionRepository).deleteAllByUser(user);
    subBeforePayment.verify(paymentRepository).deleteAllByUser(user);

    // 회원 본체는 모든 하위 데이터 삭제 후 마지막에 삭제되어야 한다
    InOrder userLast = inOrder(paymentRepository, pooRecordRepository, userRepository);
    userLast.verify(pooRecordRepository).deleteAllByUser(user);
    userLast.verify(paymentRepository).deleteAllByUser(user);
    userLast.verify(userRepository).delete(user);
  }

  @Test
  @DisplayName("리뷰 삭제 후 영향받은 화장실의 평점 통계를 재계산한다")
  void deleteUserAndRelatedData_recalculatesReviewStats() {
    User user = mock(User.class);
    Toilet toilet = mock(Toilet.class);
    given(toilet.getId()).willReturn(10L);
    given(toiletReviewRepository.findDistinctToiletsByUser(user)).willReturn(List.of(toilet));
    given(toiletReviewRepository.countByToiletId(10L)).willReturn(7L);
    given(toiletReviewRepository.calculateAvgRatingByToiletId(10L)).willReturn(4.2);

    userDeletionService.deleteUserAndRelatedData(user);

    verify(toilet).updateReviewStats(4.2, 7);
    // 리뷰가 5개 이상 남아 있으면 AI 요약을 유지한다
    verify(toilet, never()).updateAiSummary(null);
    verify(toiletRepository).save(toilet);
  }

  @Test
  @DisplayName("남은 리뷰가 5개 미만이면 화장실의 AI 요약을 초기화한다")
  void deleteUserAndRelatedData_clearsAiSummaryWhenFewReviewsRemain() {
    User user = mock(User.class);
    Toilet toilet = mock(Toilet.class);
    given(toilet.getId()).willReturn(10L);
    given(toiletReviewRepository.findDistinctToiletsByUser(user)).willReturn(List.of(toilet));
    given(toiletReviewRepository.countByToiletId(10L)).willReturn(2L);
    given(toiletReviewRepository.calculateAvgRatingByToiletId(10L)).willReturn(null);

    userDeletionService.deleteUserAndRelatedData(user);

    // 평균이 null(리뷰 없음/부족)이면 0.0으로 대체된다
    verify(toilet).updateReviewStats(0.0, 2);
    verify(toilet).updateAiSummary(null);
    verify(toiletRepository).save(toilet);
  }
}
