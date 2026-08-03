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
        String key = geoResult.getContent().getName();
        double distanceMeters = geoResult.getDistance().getValue() * 1000;

        Optional<Toilet> toiletOpt;
        try {
          Long toiletId = Long.valueOf(key);
          toiletOpt = toiletRepository.findById(toiletId);
        } catch (NumberFormatException e) {
          toiletOpt = toiletRepository.findByMngNo(key);
        }

        if (toiletOpt.isPresent()) {
          Toilet toilet = toiletOpt.get();
          ToiletResponse toiletResponse = toiletMapper.toResponse(toilet);

          calculatedResponses.add(
              EmergencyToiletResponse.builder()
                  .id(toiletResponse.id())
                  .name(toiletResponse.name())
                  .distance(distanceMeters)
                  .is24h(toiletResponse.is24h())
                  .build());
        }
      }
    }

    return calculatedResponses.stream()
        .sorted(Comparator.comparingDouble(EmergencyToiletResponse::distance))
        .limit(3)
        .toList();
  }
}
