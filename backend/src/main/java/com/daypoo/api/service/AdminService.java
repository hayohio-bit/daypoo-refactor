package com.daypoo.api.service;

import com.daypoo.api.dto.AdminStatsResponse;
import com.daypoo.api.dto.AdminStatsResponse.DailyStat;
import com.daypoo.api.dto.SystemLogResponse;
import com.daypoo.api.entity.enums.InquiryStatus;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;
  private final InquiryRepository inquiryRepository;
  private final SystemLogService systemLogService;

  @Transactional(readOnly = true)
  public AdminStatsResponse getAdminStats() {
    long allUsers = userRepository.count();
    long totalToilets = toiletRepository.count();
    long pendingInquiriesCount = inquiryRepository.countByStatus(InquiryStatus.PENDING);

    // 7일 트렌드: 일별 신규 가입자 수와 문의 수
    List<DailyStat> weeklyTrend = new ArrayList<>();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd");

    for (int i = 6; i >= 0; i--) {
      LocalDate date = LocalDate.now().minusDays(i);
      LocalDateTime start = date.atStartOfDay();
      LocalDateTime end = date.atTime(23, 59, 59);

      long dailyNewUsers = userRepository.countByCreatedAtBetween(start, end);
      long dailyInquiries = inquiryRepository.countByCreatedAtBetween(start, end);

      weeklyTrend.add(
          DailyStat.builder()
              .date(date.format(formatter))
              .users(dailyNewUsers)
              .inquiries((int) dailyInquiries)
              .build());
    }

    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
    LocalDateTime todayEnd = LocalDate.now().atTime(23, 59, 59);
    long todayNewUsers = userRepository.countByCreatedAtAfter(todayStart);
    long todayInquiriesCount = inquiryRepository.countByCreatedAtBetween(todayStart, todayEnd);

    // 당일 AI 호출 건수 집계 (SystemLog 기준)
    // build/check-in/report 생성 시 'AI' source로 로그를 남긴다고 가정
    long todayApiCalls =
        systemLogService.getRecentLogs().stream()
            .filter(l -> "AI".equals(l.source()) && l.timestamp().isAfter(todayStart))
            .count();

    return AdminStatsResponse.builder()
        .totalUsers(allUsers)
        .totalToilets(totalToilets)
        .pendingInquiries(pendingInquiriesCount)
        .todayNewUsers(todayNewUsers)
        .todayInquiries(todayInquiriesCount)
        .todayApiCalls(todayApiCalls)
        .weeklyTrend(weeklyTrend)
        .build();
  }

  @Transactional(readOnly = true)
  public List<SystemLogResponse> getSystemLogs() {
    return systemLogService.getRecentLogs();
  }
}
