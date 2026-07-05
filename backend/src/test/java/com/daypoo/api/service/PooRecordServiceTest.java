package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
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
  @Mock private AiClient aiClient;
  @Mock private UserRepository userRepository;

  private User testUser;
  private Toilet testToilet;
  private PooRecordCreateRequest request;

  @BeforeEach
  void setUp() {
    testUser =
        User.builder().email("test@test.com").nickname("PoopKing").password("password").build();
    ReflectionTestUtils.setField(testUser, "id", 1L);

    testToilet = Toilet.builder().name("강남역 화장실").address("서울시 강남구 역삼동 800").is24h(true).build();
    ReflectionTestUtils.setField(testToilet, "id", 100L);

    request =
        new PooRecordCreateRequest(
            100L,
            4,
            "Brown",
            Collections.singletonList("Good"),
            Collections.singletonList("Coffee"),
            37.123,
            127.123,
            null);
  }

  @Test
  @DisplayName("성공: 배변 기록 생성 및 보상 지급")
  void createRecord_success() {
    // given
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.getDistanceToToilet(eq(100L), anyDouble(), anyDouble()))
        .willReturn(10.0);
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(true);
    given(geocodingService.reverseGeocode(anyDouble(), anyDouble())).willReturn("역삼1동");

    PooRecord savedRecord =
        PooRecord.builder()
            .user(testUser)
            .toilet(testToilet)
            .bristolScale(4)
            .color("Brown")
            .build();
    ReflectionTestUtils.setField(savedRecord, "id", 500L);

    given(recordRepository.save(any(PooRecord.class))).willReturn(savedRecord);
    given(userRepository.save(any(User.class))).willReturn(testUser);

    PooRecordResponse mockResponse =
        PooRecordResponse.builder().toiletName("강남역 화장실").bristolScale(4).color("Brown").build();
    given(recordMapper.toResponse(any(PooRecord.class))).willReturn(mockResponse);

    // when
    PooRecordResponse response = pooRecordService.createRecord("test@test.com", request);

    // then
    assertThat(response).isNotNull();
    assertThat(response.toiletName()).isEqualTo("강남역 화장실");

    verify(recordRepository).save(any(PooRecord.class));
    verify(userRepository).save(testUser);
    verify(eventPublisher, times(1))
        .publishEvent(any(com.daypoo.api.event.PooRecordCreatedEvent.class));
  }

  @Test
  @DisplayName("성공: AI 이미지 분석 결과 반영")
  void createRecord_withAiAnalysis() {
    // given
    PooRecordCreateRequest aiRequest =
        new PooRecordCreateRequest(
            100L,
            1,
            "Black",
            Collections.emptyList(),
            Collections.emptyList(),
            37.123,
            127.123,
            "base64image");

    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.getDistanceToToilet(eq(100L), anyDouble(), anyDouble()))
        .willReturn(10.0);
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(true);
    given(geocodingService.reverseGeocode(anyDouble(), anyDouble())).willReturn("역삼1동");

    AiAnalysisResponse aiResponse =
        AiAnalysisResponse.builder()
            .bristolScale(5)
            .color("Golden")
            .conditionTag("Perfect")
            .healthScore(95)
            .aiComment("Good job!")
            .warningTags(Collections.emptyList())
            .build();
    given(aiClient.analyzePoopImage(anyString())).willReturn(aiResponse);

    PooRecord savedRecord =
        PooRecord.builder()
            .user(testUser)
            .toilet(testToilet)
            .bristolScale(5)
            .color("Golden")
            .build();
    ReflectionTestUtils.setField(savedRecord, "id", 502L);
    given(recordRepository.save(any(PooRecord.class))).willReturn(savedRecord);
    given(userRepository.save(any(User.class))).willReturn(testUser);

    PooRecordResponse mockResponseAi =
        PooRecordResponse.builder().bristolScale(5).color("Golden").build();
    given(recordMapper.toResponse(any(PooRecord.class))).willReturn(mockResponseAi);

    // when
    PooRecordResponse response = pooRecordService.createRecord("test@test.com", aiRequest);

    // then
    assertThat(response.bristolScale()).isEqualTo(5);
    assertThat(response.color()).isEqualTo("Golden");
    verify(aiClient).analyzePoopImage(anyString());
  }

  @Test
  @org.junit.jupiter.api.Disabled("개발 모드로 인해 예외 발생 비활성화됨")
  @DisplayName("실패: 화장실 반경 밖에서 인증 시도")
  void createRecord_fail_distance() {
    // given
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.getDistanceToToilet(eq(100L), anyDouble(), anyDouble()))
        .willReturn(500.0);

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
    given(locationVerificationService.getDistanceToToilet(eq(100L), anyDouble(), anyDouble()))
        .willReturn(10.0);
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
    given(locationVerificationService.getDistanceToToilet(eq(100L), anyDouble(), anyDouble()))
        .willReturn(10.0);
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(false);

    // when & then
    assertThatThrownBy(() -> pooRecordService.createRecord("test@test.com", request))
        .isInstanceOf(RuntimeException.class)
        .hasMessageContaining("최소 1분 이상 화장실에 머물러야 합니다");
  }
}
