package com.daypoo.api.entity;

import com.daypoo.api.entity.enums.VisitEventType;
import com.daypoo.api.global.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "visit_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VisitLog extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "toilet_id", nullable = false)
  private Toilet toilet;

  @Enumerated(EnumType.STRING)
  @Column(name = "event_type", nullable = false)
  private VisitEventType eventType;

  @Column(name = "arrival_at")
  private LocalDateTime arrivalAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  @Column(name = "dwell_seconds")
  private Integer dwellSeconds;

  @Column(name = "user_latitude")
  private Double userLatitude;

  @Column(name = "user_longitude")
  private Double userLongitude;

  @Column(name = "distance_meters")
  private Double distanceMeters;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "poo_record_id")
  private PooRecord pooRecord;

  @Column(name = "failure_reason", length = 50)
  private String failureReason;

  @Builder
  public VisitLog(
      User user,
      Toilet toilet,
      VisitEventType eventType,
      LocalDateTime arrivalAt,
      LocalDateTime completedAt,
      Integer dwellSeconds,
      Double userLatitude,
      Double userLongitude,
      Double distanceMeters,
      PooRecord pooRecord,
      String failureReason) {
    this.user = user;
    this.toilet = toilet;
    this.eventType = eventType;
    this.arrivalAt = arrivalAt;
    this.completedAt = completedAt;
    this.dwellSeconds = dwellSeconds;
    this.userLatitude = userLatitude;
    this.userLongitude = userLongitude;
    this.distanceMeters = distanceMeters;
    this.pooRecord = pooRecord;
    this.failureReason = failureReason;
  }
}
