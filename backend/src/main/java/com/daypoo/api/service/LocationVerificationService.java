package com.daypoo.api.service;

import com.daypoo.api.global.config.CheckInProperties;
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
  private final CheckInProperties checkInProperties;

  /**
   * 화장실까지의 거리와 허용 반경 판정 결과.
   *
   * <p>거리를 로그에 남겨야 하는 호출부가 있어서 판정만 돌려주지 않고 원값을 함께 담는다. 거리를 구하지 못하면 {@code distanceMeters} 는 null 이고
   * 판정은 항상 실패다.
   */
  public record DistanceCheck(Double distanceMeters, boolean withinAllowedRadius) {}

  /** 유저의 위치가 화장실 좌표에서 허용 반경 안에 있는지 확인하고, 실제 거리와 함께 돌려준다. */
  public DistanceCheck checkDistance(Long toiletId, double currentLat, double currentLon) {
    Double distance = toiletRepository.getDistanceToToilet(toiletId, currentLat, currentLon);
    if (distance == null) {
      log.warn("Target toilet {} not found or distance calculation failed.", toiletId);
      return new DistanceCheck(null, false);
    }

    log.info("Calculated distance to toilet {} is {} meters.", toiletId, distance);
    return new DistanceCheck(distance, distance <= checkInProperties.getAllowedRadiusMeters());
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
