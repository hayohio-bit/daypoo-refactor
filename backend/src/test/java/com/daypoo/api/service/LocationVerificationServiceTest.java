package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.daypoo.api.global.config.CheckInProperties;
import com.daypoo.api.repository.ToiletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("위치 검증 서비스 단위 테스트")
class LocationVerificationServiceTest {

  @Mock private ToiletRepository toiletRepository;
  @Mock private StringRedisTemplate redisTemplate;

  private static final long TOILET_ID = 100L;
  private static final double LAT = 37.5665;
  private static final double LON = 126.9780;

  private LocationVerificationService serviceWithRadius(double radiusMeters) {
    CheckInProperties properties = new CheckInProperties();
    properties.setAllowedRadiusMeters(radiusMeters);
    return new LocationVerificationService(toiletRepository, redisTemplate, properties);
  }

  @Test
  @DisplayName("설정한 허용 반경과 정확히 같은 거리는 통과한다")
  void 허용_반경_경계값은_통과한다() {
    given(toiletRepository.getDistanceToToilet(TOILET_ID, LAT, LON)).willReturn(150.0);

    assertThat(serviceWithRadius(150.0).isWithinAllowedDistance(TOILET_ID, LAT, LON)).isTrue();
  }

  @Test
  @DisplayName("설정한 허용 반경을 넘어서면 실패한다")
  void 허용_반경을_넘으면_실패한다() {
    given(toiletRepository.getDistanceToToilet(TOILET_ID, LAT, LON)).willReturn(150.1);

    assertThat(serviceWithRadius(150.0).isWithinAllowedDistance(TOILET_ID, LAT, LON)).isFalse();
  }

  @Test
  @DisplayName("허용 반경 설정을 바꾸면 판정 결과도 함께 바뀐다")
  void 설정값이_판정에_반영된다() {
    given(toiletRepository.getDistanceToToilet(TOILET_ID, LAT, LON)).willReturn(300.0);

    assertThat(serviceWithRadius(500.0).isWithinAllowedDistance(TOILET_ID, LAT, LON)).isTrue();
  }

  @Test
  @DisplayName("checkDistance 는 판정과 함께 실제 거리를 돌려준다")
  void 거리와_판정을_함께_반환한다() {
    given(toiletRepository.getDistanceToToilet(TOILET_ID, LAT, LON)).willReturn(42.0);

    LocationVerificationService.DistanceCheck check =
        serviceWithRadius(150.0).checkDistance(TOILET_ID, LAT, LON);

    assertThat(check.distanceMeters()).isEqualTo(42.0);
    assertThat(check.withinAllowedRadius()).isTrue();
  }

  @Test
  @DisplayName("거리 계산이 실패하면 허용하지 않는다")
  void 거리를_구하지_못하면_실패한다() {
    given(toiletRepository.getDistanceToToilet(TOILET_ID, LAT, LON)).willReturn(null);

    assertThat(serviceWithRadius(150.0).isWithinAllowedDistance(TOILET_ID, LAT, LON)).isFalse();
  }
}
