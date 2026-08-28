package com.daypoo.api.service.report;

import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ReportType;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/** 생성된 리포트를 Redis 에 하루 동안 캐싱한다. */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReportCacheStore {

  private static final String CACHE_KEY_PREFIX = "daypoo:reports:v19:";
  private static final long CACHE_TTL_HOURS = 24;

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  /** 사용자·리포트 종류·날짜 단위의 캐시 키 */
  public String buildKey(User user, ReportType type) {
    return CACHE_KEY_PREFIX
        + type.name()
        + ":"
        + user.getId()
        + ":"
        + LocalDateTime.now().toLocalDate();
  }

  /** 캐시된 리포트를 읽는다. 값이 없거나 역직렬화에 실패하면 비어 있는 값을 반환한다. */
  public Optional<HealthReportResponse> find(String cacheKey) {
    String cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached == null) return Optional.empty();
    try {
      return Optional.of(objectMapper.readValue(cached, HealthReportResponse.class));
    } catch (Exception e) {
      log.warn("Failed to parse cached report for key {}: {}", cacheKey, e.getMessage());
      return Optional.empty();
    }
  }

  /** 리포트를 캐시에 저장한다. 직렬화에 실패해도 호출부의 흐름을 끊지 않는다. */
  public void save(String cacheKey, HealthReportResponse response) {
    try {
      String serialized = objectMapper.writeValueAsString(response);
      if (serialized != null) {
        redisTemplate.opsForValue().set(cacheKey, serialized, CACHE_TTL_HOURS, TimeUnit.HOURS);
      }
    } catch (Exception e) {
      log.warn("Failed to cache report", e);
    }
  }
}
