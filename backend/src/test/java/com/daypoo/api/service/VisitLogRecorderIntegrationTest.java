package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.VisitEventType;
import com.daypoo.api.global.config.AsyncConfig;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.repository.VisitLogRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * 검증 실패 로그가 호출 트랜잭션의 롤백 뒤에도 남는지를 실제 데이터베이스로 확인한다. 단위 테스트는 트랜잭션 속성이 선언돼 있다는 것만 보여 줄 뿐, 프록시를 거쳐 실제로
 * 별도 트랜잭션이 열리는지는 보여 주지 못한다.
 *
 * <p>테스트 메서드 자체가 트랜잭션이면 롤백 시점이 가려지므로 트랜잭션 없이 실행하고, 직접 만든 바깥 트랜잭션에서 예외를 던져 롤백시킨다.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import({VisitLogRecorder.class, AsyncConfig.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class VisitLogRecorderIntegrationTest {

  @Container @ServiceConnection
  static final PostgreSQLContainer<?> POSTGRES =
      new PostgreSQLContainer<>(
          DockerImageName.parse("postgis/postgis:15-3.4").asCompatibleSubstituteFor("postgres"));

  @Autowired private VisitLogRecorder recorder;
  @Autowired private VisitLogRepository visitLogRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private ToiletRepository toiletRepository;
  @Autowired private PlatformTransactionManager transactionManager;

  @AfterEach
  void cleanUp() {
    visitLogRepository.deleteAll();
    toiletRepository.deleteAll();
    userRepository.deleteAll();
  }

  private VisitLogRecorder.Entry entry(User user, Toilet toilet, String failureReason) {
    return new VisitLogRecorder.Entry(
        user,
        toilet.getId(),
        VisitEventType.VERIFICATION_FAILED,
        null,
        null,
        37.5,
        127.0,
        500.0,
        null,
        failureReason);
  }

  private void runInTransactionThenRollback(Runnable work) {
    TransactionTemplate template = new TransactionTemplate(transactionManager);
    assertThatThrownBy(
            () ->
                template.executeWithoutResult(
                    status -> {
                      work.run();
                      throw new IllegalStateException("롤백을 일으키는 예외");
                    }))
        .isInstanceOf(IllegalStateException.class);
  }

  @Test
  @DisplayName("별도 스레드·트랜잭션으로 저장한 실패 로그는 호출 트랜잭션이 롤백되어도 남는다")
  void saveInNewTransaction_survivesCallerRollback() {
    User user =
        userRepository.save(
            User.builder().email("u@example.com").nickname("u").password("pw").build());
    Point point =
        new GeometryFactory(new PrecisionModel(), 4326).createPoint(new Coordinate(127, 37.5));
    Toilet toilet = toiletRepository.save(Toilet.builder().name("t").location(point).build());

    runInTransactionThenRollback(
        () -> recorder.saveInNewTransaction(entry(user, toilet, "OUT_OF_RANGE")));

    // 별도 스레드에서 저장되므로 커밋될 때까지 기다린다
    await()
        .atMost(java.time.Duration.ofSeconds(10))
        .untilAsserted(
            () ->
                assertThat(visitLogRepository.findAll())
                    .singleElement()
                    .satisfies(
                        log -> assertThat(log.getFailureReason()).isEqualTo("OUT_OF_RANGE")));
  }

  @Test
  @DisplayName("호출 트랜잭션에 참여한 로그는 그 트랜잭션이 롤백되면 함께 사라진다")
  void save_isRolledBackWithCaller() {
    User user =
        userRepository.save(
            User.builder().email("u@example.com").nickname("u").password("pw").build());
    Point point =
        new GeometryFactory(new PrecisionModel(), 4326).createPoint(new Coordinate(127, 37.5));
    Toilet toilet = toiletRepository.save(Toilet.builder().name("t").location(point).build());

    runInTransactionThenRollback(() -> recorder.save(entry(user, toilet, "OUT_OF_RANGE")));

    assertThat(visitLogRepository.findAll()).isEmpty();
  }
}
