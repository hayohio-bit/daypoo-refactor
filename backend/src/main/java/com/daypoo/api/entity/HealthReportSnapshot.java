package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.ReportType;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "health_report_snapshots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HealthReportSnapshot extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(name = "report_type", nullable = false)
  private ReportType reportType;

  @Column(name = "health_score", nullable = false)
  private int healthScore;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String summary;

  @Column(columnDefinition = "TEXT")
  private String solution;

  @Column(columnDefinition = "TEXT")
  private String insights;

  @Column(name = "premium_solution", columnDefinition = "TEXT")
  private String premiumSolution;

  @Column(name = "record_count", nullable = false)
  private int recordCount;

  @Column(name = "period_start", nullable = false)
  private LocalDateTime periodStart;

  @Column(name = "period_end", nullable = false)
  private LocalDateTime periodEnd;

  @Column(name = "most_frequent_bristol")
  private Integer mostFrequentBristol;

  @Column(name = "most_frequent_condition")
  private String mostFrequentCondition;

  @Column(name = "most_frequent_diet")
  private String mostFrequentDiet;

  @Column(name = "healthy_ratio")
  private Integer healthyRatio;

  @Column(name = "weekly_health_scores")
  private String weeklyHealthScores; // Comma separated

  @Column(name = "improvement_trend")
  private String improvementTrend;

  @Column(name = "bristol_distribution", columnDefinition = "TEXT")
  private String bristolDistribution; // JSON String

  @Column(name = "avg_daily_record_count")
  private Double avgDailyRecordCount;

  @Builder
  public HealthReportSnapshot(
      User user,
      ReportType reportType,
      int healthScore,
      String summary,
      String solution,
      String premiumSolution,
      String insights,
      int recordCount,
      LocalDateTime periodStart,
      LocalDateTime periodEnd,
      Integer mostFrequentBristol,
      String mostFrequentCondition,
      String mostFrequentDiet,
      Integer healthyRatio,
      String weeklyHealthScores,
      String improvementTrend,
      String bristolDistribution,
      Double avgDailyRecordCount) {
    this.user = user;
    this.reportType = reportType;
    this.healthScore = healthScore;
    this.summary = summary;
    this.solution = solution;
    this.premiumSolution = premiumSolution;
    this.insights = insights;
    this.recordCount = recordCount;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
    this.mostFrequentBristol = mostFrequentBristol;
    this.mostFrequentCondition = mostFrequentCondition;
    this.mostFrequentDiet = mostFrequentDiet;
    this.healthyRatio = healthyRatio;
    this.weeklyHealthScores = weeklyHealthScores;
    this.improvementTrend = improvementTrend;
    this.bristolDistribution = bristolDistribution;
    this.avgDailyRecordCount = avgDailyRecordCount;
  }
}
