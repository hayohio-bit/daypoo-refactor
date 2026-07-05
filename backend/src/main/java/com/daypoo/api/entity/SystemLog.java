package com.daypoo.api.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "system_log")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SystemLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 10)
  private String level; // INFO, WARN, ERROR

  @Column(nullable = false, length = 50)
  private String source; // Auth, Payment, AI, System, API, DB, Support

  @Column(nullable = false, length = 500)
  private String message;

  @CreatedDate
  @Column(name = "created_at")
  private LocalDateTime createdAt;
}
