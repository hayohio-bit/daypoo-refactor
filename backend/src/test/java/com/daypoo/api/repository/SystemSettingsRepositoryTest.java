package com.daypoo.api.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.daypoo.api.entity.SystemSettings;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * 파생 쿼리는 메서드 이름을 Spring Data 가 기동 시점에 해석하므로, 이름이 잘못되어도 컴파일과 {@code ./gradlew build} 는 통과하고 애플리케이션
 * 기동에서야 실패한다. 실제 데이터베이스에 붙는 이 테스트가 그 간극을 메운다.
 *
 * <p>일회용 컨테이너를 띄우는 이유는 {@code application-test.yml} 이 {@code ddl-auto: create-drop} 을 쓰기 때문이다. 로컬
 * 개발용 데이터베이스에 그대로 붙으면 테스트를 돌릴 때마다 개발 데이터가 사라진다.
 *
 * <p>PostGIS 이미지를 쓰는 이유는 {@code Toilet} 엔티티가 {@code geometry(Point, 4326)} 컬럼을 선언하고 있어서, 순정
 * Postgres 에서는 스키마 생성 자체가 실패하기 때문이다.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class SystemSettingsRepositoryTest {

  @Container @ServiceConnection
  static final PostgreSQLContainer<?> POSTGRES =
      new PostgreSQLContainer<>(
          DockerImageName.parse("postgis/postgis:15-3.4").asCompatibleSubstituteFor("postgres"));

  @Autowired private SystemSettingsRepository systemSettingsRepository;

  private SystemSettings settingsWithNotice(String noticeMessage) {
    return SystemSettings.builder()
        .noticeMessage(noticeMessage)
        .noticeEnabled(true)
        .maintenanceMode(false)
        .signupEnabled(true)
        .aiReportEnabled(true)
        .build();
  }

  @Test
  @DisplayName("설정 행이 없으면 현재 설정 조회는 빈 값을 돌려준다")
  void 설정이_없으면_빈_값을_반환한다() {
    Optional<SystemSettings> found = systemSettingsRepository.findCurrent();

    assertThat(found).isEmpty();
  }

  @Test
  @DisplayName("설정 행이 여럿이어도 가장 먼저 생성된 행을 돌려준다")
  void 여러_행_중_가장_먼저_생성된_행을_반환한다() {
    SystemSettings first = systemSettingsRepository.save(settingsWithNotice("먼저 저장된 설정"));
    systemSettingsRepository.save(settingsWithNotice("나중에 저장된 설정"));

    Optional<SystemSettings> found = systemSettingsRepository.findCurrent();

    assertThat(found).isPresent();
    assertThat(found.get().getId()).isEqualTo(first.getId());
    assertThat(found.get().getNoticeMessage()).isEqualTo("먼저 저장된 설정");
  }
}
