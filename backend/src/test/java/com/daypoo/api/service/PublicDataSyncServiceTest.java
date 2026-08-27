package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

import com.daypoo.api.global.GeometryUtil;
import com.daypoo.api.repository.ToiletRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Point;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.transaction.PlatformTransactionManager;

@ExtendWith(MockitoExtension.class)
@DisplayName("공공데이터 동기화 서비스 단위 테스트")
class PublicDataSyncServiceTest {

  @Mock private ToiletRepository toiletRepository;
  @Mock private GeometryUtil geometryUtil;
  @Mock private StringRedisTemplate redisTemplate;
  @Mock private GeoOperations<String, String> geoOperations;
  @Mock private JdbcTemplate jdbcTemplate;
  @Mock private PlatformTransactionManager transactionManager;
  @Mock private SystemLogService systemLogService;
  @Mock private Point point;

  private PublicDataSyncService service;

  private static final String API_RESPONSE =
      """
      {"response":{"body":{"items":{"item":[
        {"MNG_NO":"T-001","RSTRM_NM":"시청 화장실","WGS84_LAT":37.5665,"WGS84_LOT":126.9780,
         "LCTN_ROAD_NM_ADDR":"서울 중구 세종대로 110","OPN_HR":"24시간"},
        {"MNG_NO":"T-002","RSTRM_NM":"좌표 오류 화장실","WGS84_LAT":0.0,"WGS84_LOT":0.0,
         "LCTN_ROAD_NM_ADDR":"주소 없음","OPN_HR":"정시"}
      ]}}}}
      """;

  @BeforeEach
  void setUp() {
    service =
        spy(
            new PublicDataSyncService(
                toiletRepository,
                new ObjectMapper(),
                geometryUtil,
                redisTemplate,
                jdbcTemplate,
                transactionManager,
                "https://example.invalid/api",
                systemLogService));

    // 유효 좌표(T-001)만 통과, (0,0)은 탈락
    lenient().when(geometryUtil.isValidKoreaCoordinates(126.9780, 37.5665)).thenReturn(true);
    lenient().when(geometryUtil.isValidKoreaCoordinates(0.0, 0.0)).thenReturn(false);
    lenient().when(geometryUtil.createPoint(126.9780, 37.5665)).thenReturn(point);
    lenient().when(point.toText()).thenReturn("POINT (126.978 37.5665)");
    lenient().when(point.getX()).thenReturn(126.9780);
    lenient().when(point.getY()).thenReturn(37.5665);
    lenient().when(redisTemplate.opsForGeo()).thenReturn(geoOperations);
  }

  @SuppressWarnings({"unchecked", "rawtypes"})
  private void givenExistingRows(ResultSet resultSet) {
    // 서비스가 넘긴 ResultSetExtractor를 준비된 ResultSet으로 실제 실행시켜
    // private record(ExistingToiletInfo) 맵을 자연스럽게 생성한다
    willAnswer(
            invocation -> {
              ResultSetExtractor extractor = invocation.getArgument(2);
              return extractor.extractData(resultSet);
            })
        .given(jdbcTemplate)
        .query(
            anyString(),
            any(org.springframework.jdbc.core.PreparedStatementSetter.class),
            any(ResultSetExtractor.class));
  }

  private ResultSet emptyResultSet() throws Exception {
    ResultSet rs = mock(ResultSet.class);
    given(rs.next()).willReturn(false);
    return rs;
  }

  private ResultSet existingT001(String name, String wkt) throws Exception {
    ResultSet rs = mock(ResultSet.class);
    given(rs.next()).willReturn(true, false);
    given(rs.getString("mng_no")).willReturn("T-001");
    given(rs.getString("name")).willReturn(name);
    given(rs.getString("address")).willReturn("서울 중구 세종대로 110");
    given(rs.getString("location_wkt")).willReturn(wkt);
    given(rs.getString("open_hours")).willReturn("24시간");
    given(rs.getBoolean("is_24h")).willReturn(true);
    given(rs.getBoolean("is_unisex")).willReturn(false);
    return rs;
  }

  @Test
  @DisplayName("신규 데이터는 삽입으로 집계되고, 유효하지 않은 좌표의 항목은 건너뛴다")
  void sync_newData_insertsAndSkipsInvalidCoordinates() throws Exception {
    doReturn(API_RESPONSE).when(service).fetchResponseBody(1, 100);
    givenExistingRows(emptyResultSet());

    int[] result = service.syncToiletData(1, 100);

    // T-002는 좌표 무효로 제외되어 총 1건만 처리된다
    assertThat(result).containsExactly(1, 1, 0);
    verify(jdbcTemplate)
        .batchUpdate(
            anyString(), any(org.springframework.jdbc.core.BatchPreparedStatementSetter.class));
    verify(geoOperations).add(anyString(), any(java.util.Map.class));
  }

  @Test
  @DisplayName("기존 데이터와 내용이 같으면 저장과 Redis 색인을 건너뛴다")
  void sync_unchangedData_skipsWrite() throws Exception {
    doReturn(API_RESPONSE).when(service).fetchResponseBody(1, 100);
    // WKT 공백 차이는 normalizeWkt로 흡수되어 동일 판정되어야 한다
    givenExistingRows(existingT001("시청 화장실", "POINT(126.978 37.5665)"));

    int[] result = service.syncToiletData(1, 100);

    assertThat(result).containsExactly(1, 0, 0);
    verify(jdbcTemplate, never())
        .batchUpdate(
            anyString(), any(org.springframework.jdbc.core.BatchPreparedStatementSetter.class));
    verify(geoOperations, never()).add(anyString(), any(java.util.Map.class));
  }

  @Test
  @DisplayName("이름이 달라진 기존 데이터는 업데이트로 집계되고 저장된다")
  void sync_changedData_updates() throws Exception {
    doReturn(API_RESPONSE).when(service).fetchResponseBody(1, 100);
    givenExistingRows(existingT001("옛 이름", "POINT(126.978 37.5665)"));

    int[] result = service.syncToiletData(1, 100);

    assertThat(result).containsExactly(1, 0, 1);
    verify(jdbcTemplate)
        .batchUpdate(
            anyString(), any(org.springframework.jdbc.core.BatchPreparedStatementSetter.class));
  }

  @Test
  @DisplayName("응답 본문에 항목이 없으면 아무것도 처리하지 않는다")
  void sync_emptyResponse_returnsZero() throws Exception {
    doReturn("{\"response\":{\"body\":{\"items\":{\"item\":[]}}}}")
        .when(service)
        .fetchResponseBody(1, 100);

    int[] result = service.syncToiletData(1, 100);

    assertThat(result).containsExactly(0, 0, 0);
    verify(jdbcTemplate, never())
        .batchUpdate(
            anyString(), any(org.springframework.jdbc.core.BatchPreparedStatementSetter.class));
  }
}
