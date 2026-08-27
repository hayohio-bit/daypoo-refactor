package com.daypoo.api.service;

import com.daypoo.api.dto.AdminStatsResponse;
import com.daypoo.api.dto.AdminStatsResponse.DailyStat;
import com.daypoo.api.dto.AdminStatsResponse.UserDistribution;
import com.daypoo.api.dto.SystemLogResponse;
import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.InquiryStatus;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.PaymentRepository;
import com.daypoo.api.repository.SubscriptionRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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
  private final PaymentRepository paymentRepository;
  private final SubscriptionRepository subscriptionRepository;
  private final SystemLogService systemLogService;
  private final AdminInquiryService adminInquiryService;

  @Transactional(readOnly = true)
  public AdminStatsResponse getAdminStats() {
    long allUsers = userRepository.count();
    long totalToilets = toiletRepository.count();
    long pendingInquiriesCount = inquiryRepository.countByStatus(InquiryStatus.PENDING);

    // 누적 매출 계산 (Payment 테이블 전체 합계)
    long totalRevenue = paymentRepository.findAll().stream().mapToLong(Payment::getAmount).sum();

    // 1. 유저 분포 통계 (PRO, BASIC, FREE)
    long proUsersCount = subscriptionRepository.countActiveSubscriptions(LocalDateTime.now());
    long freeUsersCount = allUsers - proUsersCount;

    UserDistribution distributionStats =
        UserDistribution.builder().pro(proUsersCount).basic(0).free(freeUsersCount).build();

    // 2. 7일 트렌드 데이터 생성
    List<DailyStat> weeklyTrend = new ArrayList<>();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd");

    for (int i = 6; i >= 0; i--) {
      LocalDate date = LocalDate.now().minusDays(i);
      LocalDateTime start = date.atStartOfDay();
      LocalDateTime end = date.atTime(23, 59, 59);

      // 실제 데이터 기반 (데이터가 없을 경우 0)
      List<Payment> dailyPayments = paymentRepository.findAllByCreatedAtBetween(start, end);

      long dailyUsers =
          dailyPayments != null
              ? dailyPayments.stream()
                  .map(Payment::getEmail)
                  .filter(e -> e != null)
                  .distinct()
                  .count()
              : 0;

      long sales =
          dailyPayments != null ? dailyPayments.stream().mapToLong(Payment::getAmount).sum() : 0;

      long dailyInquiries = inquiryRepository.countByCreatedAtBetween(start, end);

      weeklyTrend.add(
          DailyStat.builder()
              .date(date.format(formatter))
              .users(dailyUsers)
              .inquiries((int) dailyInquiries)
              .sales(sales)
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
        .totalRevenue(totalRevenue)
        .todayApiCalls(todayApiCalls)
        .weeklyTrend(weeklyTrend)
        .userDistribution(distributionStats)
        .build();
  }

  @Transactional(readOnly = true)
  public List<SystemLogResponse> getSystemLogs() {
    return systemLogService.getRecentLogs();
  }

  @Transactional
  public void generateTestData() {
    log.info("Generating test data for Admin Dashboard...");

    User user =
        userRepository.findAll().stream()
            .filter(u -> u.getRole() != Role.ROLE_ADMIN)
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    for (int i = 13; i >= 0; i--) {
      LocalDate date = LocalDate.now().minusDays(i);
      int dailyCount = (int) (Math.random() * 10) + 5; // 하루 5~15건 결제

      for (int j = 0; j < dailyCount; j++) {
        LocalDateTime createdAt =
            date.atTime((int) (Math.random() * 23), (int) (Math.random() * 59));

        paymentRepository.save(
            Payment.builder()
                .email(user.getEmail())
                .user(user)
                .orderId(UUID.randomUUID().toString().substring(0, 8))
                .amount((long) ((Math.random() * 5 + 1) * 10000)) // 1만~5만원
                .paymentKey("toss_" + UUID.randomUUID().toString().substring(0, 12))
                .createdAt(createdAt)
                .build());
      }
    }

    adminInquiryService.generateInquiryTestData(user);

    log.info("Successfully generated test data.");
  }
}
