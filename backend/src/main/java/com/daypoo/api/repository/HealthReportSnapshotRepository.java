package com.daypoo.api.repository;

import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ReportType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HealthReportSnapshotRepository extends JpaRepository<HealthReportSnapshot, Long> {
  Optional<HealthReportSnapshot>
      findFirstByUserAndReportTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
          User user, ReportType reportType, LocalDateTime from, LocalDateTime to);

  List<HealthReportSnapshot> findByUserOrderByCreatedAtDesc(User user);

  /** 특정 유저의 모든 건강 리포트 스냅샷 삭제 (회원 탈퇴용) */
  void deleteAllByUser(User user);

  // 오늘 생성된 DAILY 스냅샷 전체 조회 (건강왕 초기화용)
  @Query(
      "SELECT h FROM HealthReportSnapshot h WHERE h.reportType = com.daypoo.api.entity.enums.ReportType.DAILY "
          + "AND h.createdAt >= :startOfDay AND h.createdAt < :endOfDay")
  List<HealthReportSnapshot> findTodayDailySnapshots(
      @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
