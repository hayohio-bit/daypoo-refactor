package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.HealthReportSnapshotRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.TitleRepository;
import com.daypoo.api.repository.UserRepository;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.DefaultTypedTuple;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("랭킹 서비스 테스트")
class RankingServiceTest {

  @InjectMocks private RankingService rankingService;

  @Mock private StringRedisTemplate redisTemplate;
  @Mock private UserRepository userRepository;
  @Mock private TitleRepository titleRepository;
  @Mock private PooRecordRepository recordRepository;
  @Mock private HealthReportSnapshotRepository snapshotRepository;
  @Mock private com.daypoo.api.repository.InventoryRepository inventoryRepository;
  @Mock private ZSetOperations<String, String> zSetOperations;

  private User testUser;

  @BeforeEach
  void setUp() {
    testUser = User.builder().email("test@test.com").nickname("Tester").build();
    ReflectionTestUtils.setField(testUser, "id", 1L);
    ReflectionTestUtils.setField(testUser, "points", 100L);

    lenient().when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
  }

  @Test
  @DisplayName("성공: 글로벌 랭킹 업데이트")
  void updateGlobalRank_success() {
    // given
    given(recordRepository.countByUser(testUser)).willReturn(10L);
    given(recordRepository.countDistinctToiletsByUser(testUser)).willReturn(5L);
    double expectedScore = 10 + 5 * 3.0; // 25.0

    // when
    rankingService.updateGlobalRank(testUser);

    // then
    verify(zSetOperations).add(contains("global"), eq("1"), eq(expectedScore));
  }

  @Test
  @DisplayName("성공: 지역 랭킹 업데이트")
  void updateRegionRank_success() {
    // given
    given(recordRepository.countByUserAndRegionName(testUser, "역삼동")).willReturn(4L);
    given(recordRepository.countDistinctToiletsByUserAndRegionName(testUser, "역삼동")).willReturn(2L);
    double expectedScore = 4 + 2 * 3.0; // 10.0

    // when
    rankingService.updateRegionRank(testUser, "역삼동");

    // then
    verify(zSetOperations).add(contains("역삼동"), eq("1"), eq(expectedScore));
  }

  @Test
  @DisplayName("성공: 글로벌 랭킹 조회")
  void getGlobalRanking_success() {
    // given
    Set<ZSetOperations.TypedTuple<String>> mockTuples = new LinkedHashSet<>();
    mockTuples.add(new DefaultTypedTuple<>("1", 100.0));
    mockTuples.add(new DefaultTypedTuple<>("2", 80.0));

    given(zSetOperations.reverseRangeWithScores(anyString(), anyLong(), anyLong()))
        .willReturn(mockTuples);

    User otherUser = User.builder().nickname("Other").build();
    ReflectionTestUtils.setField(otherUser, "id", 2L);

    given(userRepository.findAllById(anyList())).willReturn(Arrays.asList(testUser, otherUser));

    given(zSetOperations.reverseRank(anyString(), eq("1"))).willReturn(0L);
    given(zSetOperations.score(anyString(), eq("1"))).willReturn(100.0);

    // when
    RankingResponse response = rankingService.getGlobalRanking(testUser);

    // then
    assertThat(response.topRankers()).hasSize(2);
    assertThat(response.topRankers().get(0).nickname()).isEqualTo("Tester");
    assertThat(response.myRank().rank()).isEqualTo(1);
  }
}
