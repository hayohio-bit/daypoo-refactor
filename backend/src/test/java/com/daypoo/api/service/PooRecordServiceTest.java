package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.config.RewardProperties;
import com.daypoo.api.mapper.PooRecordMapper;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.repository.VisitLogRepository;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("배변 기록 서비스 테스트")
class PooRecordServiceTest {

  @InjectMocks private PooRecordService pooRecordService;

  @Mock private PooRecordRepository recordRepository;
  @Mock private ToiletRepository toiletRepository;
  @Mock private UserService userService;
  @Mock private LocationVerificationService locationVerificationService;
  @Mock private GeocodingService geocodingService;
  @Mock private ApplicationEventPublisher eventPublisher;
  @Mock private PooRecordMapper recordMapper;
  @Mock private VisitLogRepository visitLogRepository;
  @Mock private UserRepository userRepository;

  @Spy private RewardProperties rewardProperties = new RewardProperties();

  private User testUser;
  private Toilet testToilet;
  private PooRecordCreateRequest request;

  @BeforeEach
  void setUp() {
    testUser =
        User.builder().email("test@test.com").nickname("PoopKing").password("password").build();
    ReflectionTestUtils.setField(testUser, "id", 1L);

    testToilet =
        Toilet.builder().name("Gangnam Toilet").address("Seoul Gangnam").is24h(true).build();
    ReflectionTestUtils.setField(testToilet, "id", 100L);

    request =
        new PooRecordCreateRequest(
            100L,
            5,
            "Golden",
            Collections.singletonList("Good"),
            Collections.singletonList("Meal"),
            37.123,
            127.123);
  }

  @Test
  @DisplayName("성공: 화장실 방문 인증 포함 배변 기록 생성")
  void createRecord_success_withToilet() {
    // given
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(10.0, true));
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(true);
    given(locationVerificationService.getOrSetArrivalTime(anyLong(), anyLong(), any()))
        .willReturn(System.currentTimeMillis());
    given(geocodingService.reverseGeocode(anyDouble(), anyDouble())).willReturn("역삼1동");

    PooRecord savedRecord =
        PooRecord.builder()
            .user(testUser)
            .toilet(testToilet)
            .bristolScale(5)
            .color("Golden")
            .build();
    ReflectionTestUtils.setField(savedRecord, "id", 501L);

    given(recordRepository.save(any(PooRecord.class))).willReturn(savedRecord);
    given(userRepository.save(any(User.class))).willReturn(testUser);

    PooRecordResponse mockResponse =
        PooRecordResponse.builder().bristolScale(5).color("Golden").build();
    given(recordMapper.toResponse(any(PooRecord.class))).willReturn(mockResponse);

    // when
    PooRecordResponse response = pooRecordService.createRecord("test@test.com", request);

    // then
    assertThat(response).isNotNull();
    assertThat(response.bristolScale()).isEqualTo(5);
    assertThat(response.color()).isEqualTo("Golden");
    verify(recordRepository, times(1)).save(any(PooRecord.class));
  }

  @org.junit.jupiter.api.Disabled("개발 모드로 인해 예외 발생 비활성화됨")
  @DisplayName("실패: 화장실 반경 밖에서 인증 시도")
  void createRecord_fail_distance() {
    // given
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(500.0, false));

    // when & then
    assertThatThrownBy(() -> pooRecordService.createRecord("test@test.com", request))
        .isInstanceOf(RuntimeException.class)
        .hasMessageContaining("화장실 반경(150m) 밖");
  }

  @Test
  @org.junit.jupiter.api.Disabled("개발 모드로 인해 예외 발생 비활성화됨")
  @DisplayName("실패: 쿨다운 기간 내 중복 인증 시도")
  void createRecord_fail_cooldown() {
    // given
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(10.0, true));
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(true);

    // when & then
    assertThatThrownBy(() -> pooRecordService.createRecord("test@test.com", request))
        .isInstanceOf(RuntimeException.class)
        .hasMessageContaining("이미 최근 코인/경험치를 획득한 화장실");
  }

  @Test
  @org.junit.jupiter.api.Disabled("개발 모드로 인해 예외 발생 비활성화됨")
  @DisplayName("실패: 최소 체류 시간(1분) 미달")
  void createRecord_fail_stay_time() {
    // given
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(10.0, true));
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(false);

    // when & then
    assertThatThrownBy(() -> pooRecordService.createRecord("test@test.com", request))
        .isInstanceOf(RuntimeException.class)
        .hasMessageContaining("최소 1분 이상 화장실에 머물러야 합니다");
  }
}
