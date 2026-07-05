package com.daypoo.api.repository;

import com.daypoo.api.entity.SystemSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {
  // 횡적 구조상 보통 하나의 로우만 사용하므로 id=1 혹은 최근 값을 가져오는 방식 사용
  default Optional<SystemSettings> findCurrent() {
    return findAll().stream().findFirst();
  }
}
