package com.daypoo.api.repository;

import com.daypoo.api.entity.SystemSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {

  /**
   * 시스템 설정은 단일 행으로 운용하므로 가장 먼저 생성된 행을 현재 설정으로 본다.
   *
   * <p>{@code MaintenanceModeFilter} 가 모든 요청마다 이 조회를 거치기 때문에, 정렬과 개수 제한을 SQL 에 맡겨 필요한 한 행만 읽는다. 정렬을
   * 명시해 두면 어떤 이유로든 행이 둘 이상 생기더라도 반환되는 행이 달라지지 않는다.
   */
  default Optional<SystemSettings> findCurrent() {
    return findTopByOrderByIdAsc();
  }

  Optional<SystemSettings> findTopByOrderByIdAsc();
}
