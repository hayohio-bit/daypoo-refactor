package com.daypoo.api.service;

import com.daypoo.api.dto.EmergencyToiletResponse;
import com.daypoo.api.dto.ToiletResponse;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.mapper.ToiletMapper;
import com.daypoo.api.repository.ToiletRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.domain.geo.GeoReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyService {

  private final StringRedisTemplate redisTemplate;
  private final ToiletRepository toiletRepository;
  private final ToiletMapper toiletMapper;

  private static final String REDIS_GEO_KEY = "daypoo:toilets:geo";

  @Transactional(readOnly = true)
  public List<EmergencyToiletResponse> findEmergencyToilets(double latitude, double longitude) {

    // 반경 1km 이내 화장실 Redis GeoSearch 탐색
    Distance radiusInKm = new Distance(1.0, Metrics.KILOMETERS);

    GeoResults<RedisGeoCommands.GeoLocation<String>> geoResults = null;
    try {
      geoResults =
          redisTemplate
              .opsForGeo()
              .search(
                  REDIS_GEO_KEY,
                  GeoReference.fromCoordinate(new Point(longitude, latitude)),
                  radiusInKm,
                  RedisGeoCommands.GeoSearchCommandArgs.newGeoSearchArgs()
                      .includeDistance()
                      .sortAscending()
                      .limit(50) // limit to top 50
                  );
    } catch (Exception e) {
      log.warn("Redis GeoSearch failed", e);
      // Fallback: If Redis is empty or throws error
      return new ArrayList<>();
    }

    List<EmergencyToiletResponse> calculatedResponses = new ArrayList<>();

    if (geoResults != null && geoResults.getContent() != null) {
      for (GeoResult<RedisGeoCommands.GeoLocation<String>> geoResult : geoResults.getContent()) {
        String toiletIdStr = geoResult.getContent().getName();
        double distanceMeters = geoResult.getDistance().getValue() * 1000; // if unit was KM

        Long toiletId = Long.valueOf(toiletIdStr);
        Optional<Toilet> toiletOpt = toiletRepository.findById(toiletId);

        if (toiletOpt.isPresent()) {
          Toilet toilet = toiletOpt.get();

          // 알고리즘: Weight = (Distance * 0.7) + (OpeningHours_Weight * 0.3)
          // 거리가 짧을수록 점수가 낮아야 좋음 (혹은 높게 역전)
          // 여기서는 낮을수록 좋은 Weight Score (Penalty)
          double distancePenalty = distanceMeters * 0.7;
          double timePenalty = toilet.is24h() ? 0 : 500; // 24시간인 경우 패널티 없음, 아니면 500점 패널티 부여

          double finalWeight = distancePenalty + (timePenalty * 0.3);

          ToiletResponse toiletResponse = toiletMapper.toResponse(toilet);

          ToiletResponse finalResponse =
              ToiletResponse.builder()
                  .id(toiletResponse.id())
                  .name(toiletResponse.name())
                  .address(toiletResponse.address())
                  .openHours(toiletResponse.openHours())
                  .is24h(toiletResponse.is24h())
                  .latitude(toiletResponse.latitude())
                  .longitude(toiletResponse.longitude())
                  .build();

          calculatedResponses.add(
              EmergencyToiletResponse.builder()
                  .id(finalResponse.id())
                  .name(finalResponse.name())
                  .distance(distanceMeters)
                  .is24h(finalResponse.is24h())
                  .build());
        }
      }
    }

    // 거리 순으로 정렬하여 상위 3개 반환 (EmergencyToiletResponse 구조에 맞춰 수정)
    return calculatedResponses.stream()
        .sorted(Comparator.comparingDouble(EmergencyToiletResponse::distance))
        .limit(3)
        .toList();
  }
}
