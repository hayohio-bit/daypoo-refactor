package com.daypoo.api.service;

import com.daypoo.api.dto.SystemLogResponse;
import com.daypoo.api.entity.SystemLog;
import com.daypoo.api.repository.SystemLogRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemLogService {

  private final SystemLogRepository systemLogRepository;

  @Transactional(readOnly = true)
  public List<SystemLogResponse> getRecentLogs() {
    return systemLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
        .map(
            l ->
                SystemLogResponse.builder()
                    .id(l.getId())
                    .level(l.getLevel())
                    .source(l.getSource())
                    .message(l.getMessage())
                    .timestamp(l.getCreatedAt())
                    .build())
        .toList();
  }

  @Transactional
  public void log(String level, String source, String message) {
    systemLogRepository.save(
        SystemLog.builder().level(level).source(source).message(message).build());
  }

  public void info(String source, String message) {
    log("INFO", source, message);
  }

  public void warn(String source, String message) {
    log("WARN", source, message);
  }

  public void error(String source, String message) {
    log("ERROR", source, message);
  }
}
