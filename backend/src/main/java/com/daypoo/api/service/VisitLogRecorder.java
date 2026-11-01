package com.daypoo.api.service;

import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.VisitLog;
import com.daypoo.api.entity.enums.VisitEventType;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.VisitLogRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 방문 로그 저장. 검증 실패 로그는 곧이어 예외가 던져져 호출 서비스의 트랜잭션이 롤백되므로 별도 트랜잭션으로 저장해야 남는다. 같은 클래스 안에서 호출하면 프록시를 거치지
 * 않아 트랜잭션 속성이 적용되지 않기 때문에 별도 컴포넌트로 분리했다.
 */
@Component
@RequiredArgsConstructor
public class VisitLogRecorder {

  private final ToiletRepository toiletRepository;
  private final VisitLogRepository visitLogRepository;

  public record Entry(
      User user,
      Long toiletId,
      VisitEventType eventType,
      LocalDateTime arrivalAt,
      LocalDateTime completedAt,
      double lat,
      double lon,
      Double distance,
      PooRecord record,
      String failureReason) {}

  /** 호출 트랜잭션에 참여해 저장한다. */
  @Transactional
  public void save(Entry entry) {
    persist(entry);
  }

  /**
   * 호출 트랜잭션의 롤백과 무관하게 독립적으로 커밋한다. 호출 스레드는 이미 커넥션을 쥐고 있으므로 같은 스레드에서 두 번째 커넥션을 기다리면 풀이 작을 때(운영 10개)
   * 동시 실패 요청이 서로를 기다리며 멈춘다. 그래서 별도 스레드에서 실행해 호출 스레드가 기다리지 않게 한다.
   */
  @Async("taskExecutor")
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void saveInNewTransaction(Entry entry) {
    persist(entry);
  }

  private void persist(Entry e) {
    Toilet toilet = toiletRepository.findById(e.toiletId()).orElse(null);
    if (toilet == null) return;

    visitLogRepository.save(
        VisitLog.builder()
            .user(e.user())
            .toilet(toilet)
            .eventType(e.eventType())
            .arrivalAt(e.arrivalAt())
            .completedAt(e.completedAt())
            .userLatitude(e.lat())
            .userLongitude(e.lon())
            .distanceMeters(e.distance())
            .pooRecord(e.record())
            .failureReason(e.failureReason())
            .dwellSeconds(
                e.arrivalAt() != null && e.completedAt() != null
                    ? (int) Duration.between(e.arrivalAt(), e.completedAt()).toSeconds()
                    : null)
            .build());
  }
}
