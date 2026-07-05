package com.daypoo.api.service;

import com.daypoo.api.repository.ToiletRepository;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationVerificationService {

  private final ToiletRepository toiletRepository;
  private final StringRedisTemplate redisTemplate;

  // 허용 제한 거리: 150미터 (GPS 음영 지역 및 오차 고려 - A안 반영)
  private static final double ALLOWED_RADIUS_METERS = 150.0;

  /** 유저의 위치가 화장실 좌표랑 허용 범위(50m) 안에 있는지 체크 */
  public boolean isWithinAllowedDistance(Long toiletId, double currentLat, double currentLon) {
    Double distance = toiletRepository.getDistanceToToilet(toiletId, currentLat, currentLon);
    if (distance == null) {
      log.warn("Target toilet {} not found or distance calculation failed.", toiletId);
      return false;
    }

    log.info("Calculated distance to toilet {} is {} meters.", toiletId, distance);
    return distance <= ALLOWED_RADIUS_METERS;
  }

  /** 실제 화장실까지의 거리를 미터 단위로 반환 (로그 기록용) */
  public Double getDistanceToToilet(Long toiletId, double currentLat, double currentLon) {
    return toiletRepository.getDistanceToToilet(toiletId, currentLat, currentLon);
  }

  /** 화장실 도착 시간 기록 및 최초 시간 반환 (Fast Check-in 용) */
  public long getOrSetArrivalTime(Long userId, Long toiletId, Long enteredAt) {
    String key = "daypoo:record:arrival:user:" + userId + ":toilet:" + toiletId;
    long currentTime = System.currentTimeMillis();
    long arrivalTime = (enteredAt != null) ? enteredAt : currentTime;
    String arrivalTimeStr = String.valueOf(arrivalTime);

    // 도착 시간은 1시간 동안만 유지 (그 안에 기록을 완료해야 함)
    Boolean isFirst =
        redisTemplate.opsForValue().setIfAbsent(key, arrivalTimeStr, Duration.ofHours(1));

    if (Boolean.TRUE.equals(isFirst)) {
      return arrivalTime;
    } else {
      String existingTimeStr = redisTemplate.opsForValue().get(key);
      if (existingTimeStr != null) {
        return Long.parseLong(existingTimeStr);
      }
      return currentTime; // 만약의 Fallback
    }
  }

  /** 인증 완료 후 arrival 키 삭제 → 재인증 시 60초 타이머 리셋 허용 */
  public void resetArrivalTime(Long userId, Long toiletId) {
    String key = "daypoo:record:arrival:user:" + userId + ":toilet:" + toiletId;
    redisTemplate.delete(key);
  }

  /** 최소 체류 시간(1분)이 지났는지 확인 */
  public boolean hasStayedLongEnough(Long userId, Long toiletId) {
    String key = "daypoo:record:arrival:user:" + userId + ":toilet:" + toiletId;
    String arrivalTimeStr = redisTemplate.opsForValue().get(key);

    if (arrivalTimeStr == null) {
      log.warn(
          "Arrival time not found for user {} at toilet {}. Assuming check-in skipped.",
          userId,
          toiletId);
      return false;
    }

    long arrivalTime = Long.parseLong(arrivalTimeStr);
    long currentTime = System.currentTimeMillis();
    long stayDurationSeconds = (currentTime - arrivalTime) / 1000;

    log.info(
        "User {} has stayed at toilet {} for {} seconds.", userId, toiletId, stayDurationSeconds);

    // 최소 1분(60초) 체류 여부 확인
    return stayDurationSeconds >= 60;
  }
}
