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
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.mapper.PooRecordMapper;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InOrder;
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
  @Mock private VisitLogRecorder visitLogRecorder;
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
    given(locationVerificationService.getOrSetArrivalTime(anyLong(), anyLong()))
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

  @Test
  @DisplayName("성공: 방문 로그용 도착 시각은 타이머 리셋 전에 읽고, 리셋 뒤에는 다시 만들지 않는다")
  void createRecord_readsArrivalTimeBeforeReset() {
    // given
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(10.0, true));
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(true);
    given(locationVerificationService.getOrSetArrivalTime(anyLong(), anyLong()))
        .willReturn(System.currentTimeMillis() - 90_000);
    given(geocodingService.reverseGeocode(anyDouble(), anyDouble())).willReturn("역삼1동");
    PooRecord savedRecord =
        PooRecord.builder()
            .user(testUser)
            .toilet(testToilet)
            .bristolScale(5)
            .color("Golden")
            .build();
    given(recordRepository.save(any(PooRecord.class))).willReturn(savedRecord);
    given(userRepository.save(any(User.class))).willReturn(testUser);
    given(recordMapper.toResponse(any(PooRecord.class)))
        .willReturn(PooRecordResponse.builder().bristolScale(5).color("Golden").build());

    // when
    pooRecordService.createRecord("test@test.com", request);

    // then: 조회(1회) → 리셋 순서이고, 리셋 뒤에는 도착 시각 키를 다시 건드리지 않는다
    InOrder inOrder = inOrder(locationVerificationService);
    inOrder.verify(locationVerificationService).getOrSetArrivalTime(anyLong(), anyLong());
    inOrder.verify(locationVerificationService).resetArrivalTime(1L, 100L);
    inOrder.verifyNoMoreInteractions();
  }

  @ParameterizedTest(name = "[{index}] {0}")
  @ValueSource(strings = {"test@test.com", "bot_abuser@example.com"})
  @DisplayName("실패: 화장실 반경 밖에서 인증 시도 (bot_ 접두사 이메일도 검증을 건너뛰지 않는다)")
  void createRecord_fail_distance(String email) {
    // given
    givenUser(email);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(500.0, false));

    // when & then
    assertThatThrownBy(() -> pooRecordService.createRecord(email, request))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.OUT_OF_RANGE);
    verify(recordRepository, never()).save(any(PooRecord.class));
    // 실패 로그는 롤백되지 않도록 별도 트랜잭션 경로로 저장한다
    verify(visitLogRecorder).saveInNewTransaction(any(VisitLogRecorder.Entry.class));
    verify(visitLogRecorder, never()).save(any(VisitLogRecorder.Entry.class));
  }

  @Test
  @DisplayName("실패: 실패 로그 저장이 예외를 던져도 원래 검증 실패 예외가 그대로 나간다")
  void createRecord_logFailureDoesNotMaskValidationError() {
    given(userService.getByEmail("test@test.com")).willReturn(testUser);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(500.0, false));
    org.mockito.Mockito.doThrow(new org.springframework.core.task.TaskRejectedException("큐 포화"))
        .when(visitLogRecorder)
        .saveInNewTransaction(any(VisitLogRecorder.Entry.class));

    assertThatThrownBy(() -> pooRecordService.createRecord("test@test.com", request))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.OUT_OF_RANGE);
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

  @ParameterizedTest(name = "[{index}] {0}")
  @ValueSource(strings = {"test@test.com", "bot_abuser@example.com"})
  @DisplayName("실패: 최소 체류 시간(1분) 미달 (bot_ 접두사 이메일도 검증을 건너뛰지 않는다)")
  void createRecord_fail_stay_time(String email) {
    // given
    givenUser(email);
    given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
    given(locationVerificationService.checkDistance(eq(100L), anyDouble(), anyDouble()))
        .willReturn(new LocationVerificationService.DistanceCheck(10.0, true));
    given(locationVerificationService.hasStayedLongEnough(eq(1L), eq(100L))).willReturn(false);

    // when & then
    assertThatThrownBy(() -> pooRecordService.createRecord(email, request))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.STAY_TIME_NOT_MET);
    verify(recordRepository, never()).save(any(PooRecord.class));
  }

  private void givenUser(String email) {
    User user = User.builder().email(email).nickname("PoopKing").password("password").build();
    ReflectionTestUtils.setField(user, "id", 1L);
    given(userService.getByEmail(email)).willReturn(user);
  }
}
