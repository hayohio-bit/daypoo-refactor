package com.daypoo.api.service;

import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.UserRepository;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final PooRecordRepository pooRecordRepository;

  /** 이메일로 사용자 조회 (없으면 USER_NOT_FOUND 예외) */
  @Transactional(readOnly = true)
  public User getByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
  }

  @Transactional
  public void updateUser(User user) {
    if (user != null) {
      userRepository.save(user);
    }
  }

  /** 총 인증 횟수 조회 */
  @Transactional(readOnly = true)
  public Long getTotalAuthCount(User user) {
    return pooRecordRepository.countByUser(user);
  }

  /** 방문한 화장실 개수 조회 */
  @Transactional(readOnly = true)
  public Long getTotalVisitCount(User user) {
    List<PooRecord> records =
        pooRecordRepository
            .findByUserOrderByCreatedAtDesc(
                user, org.springframework.data.domain.Pageable.unpaged())
            .getContent();
    Set<Long> uniqueToilets = new HashSet<>();
    for (PooRecord record : records) {
      if (record.getToilet() != null) {
        uniqueToilets.add(record.getToilet().getId());
      }
    }
    return (long) uniqueToilets.size();
  }

  /** 연속 기록 일수 계산 */
  @Transactional(readOnly = true)
  public Integer getConsecutiveDays(User user) {
    List<PooRecord> records =
        pooRecordRepository
            .findByUserOrderByCreatedAtDesc(
                user, org.springframework.data.domain.Pageable.unpaged())
            .getContent();
    if (records.isEmpty()) {
      return 0;
    }

    int streak = 1;
    LocalDate lastDate = records.get(0).getCreatedAt().toLocalDate();

    for (int i = 1; i < records.size(); i++) {
      LocalDate currentDate = records.get(i).getCreatedAt().toLocalDate();
      long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(currentDate, lastDate);

      if (daysDiff == 1) {
        streak++;
        lastDate = currentDate;
      } else if (daysDiff > 1) {
        break;
      }
      // daysDiff == 0이면 같은 날이므로 streak는 증가하지 않고 계속 진행
    }

    return streak;
  }
}
