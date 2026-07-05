package com.daypoo.api.service;

import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.UserTitle;
import com.daypoo.api.entity.enums.AchievementType;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.TitleRepository;
import com.daypoo.api.repository.UserTitleRepository;
import com.daypoo.api.repository.VisitCountProjection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TitleAchievementService {

  private final PooRecordRepository recordRepository;
  private final TitleRepository titleRepository;
  private final UserTitleRepository userTitleRepository;
  private final NotificationService notificationService;
  private final UserService userService;

  /** 유저의 업적 달성 여부를 검사하고 칭호를 부여함 */
  @Transactional
  public void checkAndGrantTitles(User user) {
    // [Manual Acquisition Flow] 자동 획득 로직 비활성화
    // 사용자가 직접 '획득' 버튼을 눌러야 칭호가 부여되도록 변경됨
  }

  /** 개별 칭호 획득 (사용자 수동 요청) */
  @Transactional
  public void grantTitleSpecific(User user, Long titleId) {
    Title title =
        titleRepository
            .findById(titleId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 칭호입니다."));

    if (userTitleRepository.existsByUserAndTitle(user, title)) {
      throw new IllegalStateException("이미 획득한 칭호입니다.");
    }

    if (!checkAchievement(user, title)) {
      throw new IllegalStateException("아직 해당 업적을 달성하지 못했습니다.");
    }

    grantTitle(user, title);
  }

  private boolean checkAchievement(User user, Title title) {
    long value = computeProgress(user, title.getAchievementType());
    return value >= title.getAchievementThreshold();
  }

  public long computeProgress(User user, AchievementType type) {
    return switch (type) {
      case TOTAL_RECORDS -> recordRepository.countByUser(user);
      case UNIQUE_TOILETS -> recordRepository.countDistinctToiletsByUser(user);
      case CONSECUTIVE_DAYS -> (long) userService.getConsecutiveDays(user);
      case SAME_TOILET_VISITS ->
          recordRepository.findVisitCountsByUser(user).stream()
              .mapToLong(VisitCountProjection::getVisitCount)
              .max()
              .orElse(0);
      case LEVEL_REACHED -> (long) user.getLevel();
    };
  }

  private void grantTitle(User user, Title title) {
    UserTitle userTitle = UserTitle.builder().user(user).title(title).build();
    userTitleRepository.saveAndFlush(userTitle);
    log.info("New title granted to user {}: {}", user.getEmail(), title.getName());

    // 알림 발송 (Push/In-app)
    String notificationTitle = "새로운 칭호 획득!";
    String notificationContent = String.format("업적을 달성하여 [%s] 칭호를 획득했습니다!", title.getName());
    notificationService.send(
        user,
        NotificationType.ACHIEVEMENT,
        notificationTitle,
        notificationContent,
        "/mypage?tab=collection");
  }
}
