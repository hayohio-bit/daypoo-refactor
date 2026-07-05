package com.daypoo.api.repository;

import com.daypoo.api.entity.SystemLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
  List<SystemLog> findTop50ByOrderByCreatedAtDesc();
}
