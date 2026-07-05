package com.daypoo.api.service;

import com.daypoo.api.dto.SyncStatusResponse;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.global.GeometryUtil;
import com.daypoo.api.repository.ToiletRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

@Slf4j
@Service
public class PublicDataSyncService {

  private final ObjectMapper objectMapper;
  private final GeometryUtil geometryUtil;
  private final StringRedisTemplate redisTemplate;
  private final JdbcTemplate jdbcTemplate;
  private final PlatformTransactionManager transactionManager;
  private final WebClient webClient;
  private final SystemLogService systemLogService;
  private final ToiletRepository toiletRepository;

  @Value("${public-data.api-key}")
  private String apiKey;

  private static final String REDIS_GEO_KEY = "daypoo:toilets:geo";
  private static final int BATCH_SIZE = 100;
  private static final int MAX_CONCURRENT_REQUESTS = 10;
  private static final DateTimeFormatter DATE_TIME_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  // Status tracking fields
  private volatile String syncStatus = "IDLE";
  private volatile Integer lastCount = null;
  private volatile Integer insertedCount = null;
  private volatile Integer updatedCount = null;
  private volatile String startedAt = null;
  private volatile String completedAt = null;
  private volatile String errorMessage = null;

  private record ExistingToiletInfo(
      String name,
      String address,
      String locationWkt,
      String openHours,
      boolean is24h,
      boolean isUnisex) {}

  public PublicDataSyncService(
      ToiletRepository toiletRepository,
      ObjectMapper objectMapper,
      GeometryUtil geometryUtil,
      StringRedisTemplate redisTemplate,
      JdbcTemplate jdbcTemplate,
      PlatformTransactionManager transactionManager,
      @Value("${public-data.url}") String apiUrl,
      SystemLogService systemLogService) {
    this.objectMapper = objectMapper;
    this.geometryUtil = geometryUtil;
    this.redisTemplate = redisTemplate;
    this.jdbcTemplate = jdbcTemplate;
    this.transactionManager = transactionManager;
    this.webClient = WebClient.builder().baseUrl(apiUrl).build();
    this.systemLogService = systemLogService;
    this.toiletRepository = toiletRepository;
  }

  /** 매일 새벽 3시에 공공데이터 전체 동기화를 실행합니다. 서버 시작 시에는 toilet 데이터가 없는 경우에만 소규모 동기화를 수행합니다. */
  @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 3 * * *")
  public void scheduledSync() {
    log.info("🕒 [Scheduled] Starting daily public data sync...");
    systemLogService.info("System", "Scheduled toilet data sync started");
    try {
      int[] result = syncAllToilets(1, 550);
      systemLogService.info(
          "System",
          "Scheduled sync completed. Total: "
              + result[0]
              + ", Inserted: "
              + result[1]
              + ", Updated: "
              + result[2]);
      log.info(
          "✅ [Scheduled] Daily sync completed. Total: {}, Inserted: {}, Updated: {}",
          result[0],
          result[1],
          result[2]);
    } catch (Exception e) {
      systemLogService.error("System", "Scheduled sync failed: " + e.getMessage());
      log.error("❌ [Scheduled] Daily sync failed: {}", e.getMessage());
    }
  }

  /** 앱 기동 시 화장실 데이터가 하나도 없으면 1~50페이지까지 초기 동기화를 수행합니다. */
  @org.springframework.context.event.EventListener(
      org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void initSyncOnStartup() {
    long count = toiletRepository.count();
    if (count == 0) {
      log.info("ℹ️ DB에 화장실 데이터가 없습니다. 초기 동기화를 시작합니다 (1-100페이지)...");
      systemLogService.info("System", "Initial toilet sync triggered on startup (DB empty)");
      syncAllToiletsAsync(1, 100);
    } else {
      log.info("✅ DB에 {}개의 화장실 데이터가 존재합니다. 초기 동기화를 스킵합니다.", count);
    }
  }

  /** 가상 스레드 + 배치 단위 처리로 메모리 안전하게 동기화합니다. 반환: [총처리, 신규, 업데이트] */
  public int[] syncAllToilets(int startPage, int endPage) {
    AtomicInteger totalCount = new AtomicInteger(0);
    AtomicInteger totalInserted = new AtomicInteger(0);
    AtomicInteger totalUpdated = new AtomicInteger(0);
    int batchPages = 20;

    log.info(
        "🚀 Starting public data sync (pages: {}-{}, batch: {}, concurrent: {})...",
        startPage,
        endPage,
        batchPages,
        MAX_CONCURRENT_REQUESTS);

    TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

    for (int batchStart = startPage; batchStart <= endPage; batchStart += batchPages) {
      int batchEnd = Math.min(batchStart + batchPages - 1, endPage);

      try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Semaphore semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (int page = batchStart; page <= batchEnd; page++) {
          int currentPage = page;
          futures.add(
              CompletableFuture.runAsync(
                  () -> {
                    try {
                      semaphore.acquire();
                      int[] result =
                          syncToiletDataWithInQuery(currentPage, BATCH_SIZE, transactionTemplate);
                      totalCount.addAndGet(result[0]);
                      totalInserted.addAndGet(result[1]);
                      totalUpdated.addAndGet(result[2]);
                    } catch (Exception e) {
                      log.error("⚠️ Error processing page {}: {}", currentPage, e.getMessage());
                    } finally {
                      semaphore.release();
                    }
                  },
                  executor));
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
      }

      log.info(
          "📈 Batch {}-{} done. Total: {}, Inserted: {}, Updated: {}",
          batchStart,
          batchEnd,
          totalCount.get(),
          totalInserted.get(),
          totalUpdated.get());
    }

    log.info(
        "🏁 Sync Finished. Total: {}, Inserted: {}, Updated: {}",
        totalCount.get(),
        totalInserted.get(),
        totalUpdated.get());
    return new int[] {totalCount.get(), totalInserted.get(), totalUpdated.get()};
  }

  /** 상태 조회 메서드 */
  public SyncStatusResponse getSyncStatus() {
    return SyncStatusResponse.builder()
        .status(syncStatus)
        .totalCount(lastCount)
        .insertedCount(insertedCount)
        .updatedCount(updatedCount)
        .startedAt(startedAt)
        .completedAt(completedAt)
        .errorMessage(errorMessage)
        .build();
  }

  /** 비동기 실행 메서드 */
  @Async("taskExecutor")
  public void syncAllToiletsAsync(int startPage, int endPage) {
    syncStatus = "RUNNING";
    startedAt = LocalDateTime.now().format(DATE_TIME_FORMATTER);
    completedAt = null;
    errorMessage = null;
    lastCount = null;
    insertedCount = null;
    updatedCount = null;

    try {
      log.info("📢 Starting background sync: {} - {}", startPage, endPage);
      systemLogService.info(
          "System", "Background toilet sync started: pages " + startPage + "-" + endPage);
      int[] result = syncAllToilets(startPage, endPage);
      lastCount = result[0];
      insertedCount = result[1];
      updatedCount = result[2];
      syncStatus = "COMPLETED";
      completedAt = LocalDateTime.now().format(DATE_TIME_FORMATTER);
      systemLogService.info(
          "System",
          "Background sync completed. Total: "
              + result[0]
              + ", Inserted: "
              + result[1]
              + ", Updated: "
              + result[2]);
      log.info(
          "✅ Background sync finished. Total: {}, Inserted: {}, Updated: {}",
          result[0],
          result[1],
          result[2]);
    } catch (Exception e) {
      systemLogService.error("System", "Background sync failed: " + e.getMessage());
      log.error("❌ Background sync failed: {}", e.getMessage());
      syncStatus = "FAILED";
      errorMessage = e.getMessage();
      completedAt = LocalDateTime.now().format(DATE_TIME_FORMATTER);
    }
  }

  /** 단일 페이지 동기화를 위한 호환성 메서드. 반환: [총처리, 신규, 업데이트] */
  public int[] syncToiletData(int pageNo, int numOfRows) throws Exception {
    TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
    return syncToiletDataWithInQuery(pageNo, numOfRows, transactionTemplate);
  }

  /** 반환: [총처리, 신규, 업데이트] */
  private int[] syncToiletDataWithInQuery(
      int pageNo, int numOfRows, TransactionTemplate transactionTemplate) throws Exception {
    String responseBody = fetchResponseBody(pageNo, numOfRows);
    JsonNode rootNode = objectMapper.readTree(responseBody);
    JsonNode bodyNode = rootNode.path("response").path("body");
    if (bodyNode.isMissingNode()) return new int[] {0, 0, 0};

    JsonNode itemsNode = bodyNode.path("items").path("item");
    if (!itemsNode.isArray() || itemsNode.isEmpty()) return new int[] {0, 0, 0};

    List<JsonNode> itemList = new ArrayList<>();
    for (JsonNode item : itemsNode) {
      String mngNo = item.path("MNG_NO").asText("");
      if (!mngNo.isEmpty()) {
        itemList.add(item);
      }
    }

    List<Toilet> toiletsToSave = convertToToiletEntities(itemList);
    if (toiletsToSave.isEmpty()) return new int[] {0, 0, 0};

    // upsert 전에 기존 데이터 상세 조회하여 실제 변경 여부 확인
    List<String> mngNos =
        toiletsToSave.stream().map(Toilet::getMngNo).collect(java.util.stream.Collectors.toList());
    String inClause =
        mngNos.stream()
            .map(m -> "'" + m.replace("'", "''") + "'")
            .collect(java.util.stream.Collectors.joining(","));

    Map<String, ExistingToiletInfo> existingMap =
        jdbcTemplate.query(
            "SELECT mng_no, name, address, ST_AsText(location) as location_wkt, open_hours, is_24h, is_unisex FROM toilets WHERE mng_no IN ("
                + inClause
                + ")",
            (rs) -> {
              Map<String, ExistingToiletInfo> map = new HashMap<>();
              while (rs.next()) {
                map.put(
                    rs.getString("mng_no"),
                    new ExistingToiletInfo(
                        rs.getString("name"),
                        rs.getString("address"),
                        rs.getString("location_wkt"),
                        rs.getString("open_hours"),
                        rs.getBoolean("is_24h"),
                        rs.getBoolean("is_unisex")));
              }
              return map;
            });
    if (existingMap == null) existingMap = new HashMap<>();

    int inserted = 0;
    int updated = 0;
    List<Toilet> changedToilets = new ArrayList<>();

    for (Toilet apiToilet : toiletsToSave) {
      ExistingToiletInfo existing = existingMap.get(apiToilet.getMngNo());
      if (existing == null) {
        inserted++;
        changedToilets.add(apiToilet);
      } else {
        String apiWkt =
            apiToilet.getLocation() != null ? normalizeWkt(apiToilet.getLocation().toText()) : null;
        String dbWkt = normalizeWkt(existing.locationWkt());

        boolean isChanged =
            !Objects.equals(normalize(apiToilet.getName()), normalize(existing.name()))
                || !Objects.equals(normalize(apiToilet.getAddress()), normalize(existing.address()))
                || !Objects.equals(apiWkt, dbWkt)
                || !Objects.equals(
                    normalize(apiToilet.getOpenHours()), normalize(existing.openHours()))
                || apiToilet.is24h() != existing.is24h()
                || apiToilet.isUnisex() != existing.isUnisex();

        if (isChanged) {
          updated++;
          changedToilets.add(apiToilet);
        }
      }
    }

    if (!changedToilets.isEmpty()) {
      transactionTemplate.execute(
          status -> {
            bulkInsertToilets(changedToilets);
            return null;
          });
      addToRedisGeoBulk(changedToilets);
    }
    return new int[] {toiletsToSave.size(), inserted, updated};
  }

  private String fetchResponseBody(int pageNo, int numOfRows) {
    return webClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("")
                    .queryParam("serviceKey", apiKey)
                    .queryParam("pageNo", pageNo)
                    .queryParam("numOfRows", numOfRows)
                    .queryParam("returnType", "json")
                    .build())
        .retrieve()
        .bodyToMono(String.class)
        .retryWhen(Retry.backoff(2, Duration.ofSeconds(1)).maxBackoff(Duration.ofSeconds(5)))
        .block();
  }

  private List<Toilet> convertToToiletEntities(List<JsonNode> itemList) {
    List<Toilet> toiletsToSave = new ArrayList<>();
    Set<String> processedMngNos = new HashSet<>();
    for (JsonNode item : itemList) {
      String mngNo = item.path("MNG_NO").asText("");
      if (mngNo.isEmpty() || processedMngNos.contains(mngNo)) continue;

      double lat = item.path("WGS84_LAT").asDouble(0.0);
      double lon = item.path("WGS84_LOT").asDouble(0.0);
      Point location =
          (lat >= 33.0 && lat <= 39.0 && lon >= 124.0 && lon <= 132.0)
              ? geometryUtil.createPoint(lon, lat)
              : null;

      toiletsToSave.add(
          Toilet.builder()
              .name(item.path("RSTRM_NM").asText("이름 없음"))
              .mngNo(mngNo)
              .location(location)
              .address(
                  item.path("LCTN_ROAD_NM_ADDR").asText(item.path("LCTN_LOTNO_ADDR").asText("")))
              .openHours(item.path("OPN_HR").asText("상시개방"))
              .is24h(
                  item.path("OPN_HR").asText("").contains("24")
                      || item.path("OPN_HR").asText("").contains("상시"))
              .isUnisex(false)
              .build());

      processedMngNos.add(mngNo);
    }
    return toiletsToSave;
  }

  private void bulkInsertToilets(List<Toilet> toilets) {
    // 3. Multi-row Insert/Update (Upsert) 최적화
    String sql =
        "INSERT INTO toilets (name, mng_no, location, address, open_hours, is_24h, is_unisex, created_at, updated_at) "
            + "VALUES (?, ?, ST_GeomFromText(?, 4326), ?, ?, ?, ?, NOW(), NOW()) "
            + "ON CONFLICT (mng_no) DO UPDATE SET "
            + "  name        = EXCLUDED.name, "
            + "  location    = EXCLUDED.location, "
            + "  address     = EXCLUDED.address, "
            + "  open_hours  = EXCLUDED.open_hours, "
            + "  is_24h      = EXCLUDED.is_24h, "
            + "  is_unisex   = EXCLUDED.is_unisex, "
            + "  updated_at  = NOW() "
            + "  WHERE (toilets.name != EXCLUDED.name OR toilets.address != EXCLUDED.address "
            + "  OR toilets.location IS DISTINCT FROM EXCLUDED.location OR toilets.open_hours != EXCLUDED.open_hours "
            + "  OR toilets.is_24h != EXCLUDED.is_24h OR toilets.is_unisex != EXCLUDED.is_unisex)";

    jdbcTemplate.batchUpdate(
        sql,
        new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
          @Override
          public void setValues(PreparedStatement ps, int i) throws java.sql.SQLException {
            Toilet t = toilets.get(i);
            ps.setString(1, t.getName());
            ps.setString(2, t.getMngNo());
            ps.setString(3, t.getLocation() != null ? t.getLocation().toText() : null);
            ps.setString(4, t.getAddress());
            ps.setString(5, t.getOpenHours());
            ps.setBoolean(6, t.is24h());
            ps.setBoolean(7, t.isUnisex());
          }

          @Override
          public int getBatchSize() {
            return toilets.size();
          }
        });
  }

  private void addToRedisGeoBulk(List<Toilet> toilets) {
    // 4. Redis Bulk Geo Indexing (네트워크 RTT 최소화)
    Map<String, org.springframework.data.geo.Point> memberCoordsMap = new HashMap<>();
    for (Toilet t : toilets) {
      if (t.getLocation() != null) {
        memberCoordsMap.put(
            t.getMngNo(),
            new org.springframework.data.geo.Point(t.getLocation().getX(), t.getLocation().getY()));
      }
    }

    if (!memberCoordsMap.isEmpty()) {
      try {
        redisTemplate.opsForGeo().add(REDIS_GEO_KEY, memberCoordsMap);
      } catch (Exception e) {
        log.warn("Failed to add geo data to Redis bulk: {}", e.getMessage());
      }
    }
  }

  private String normalize(String s) {
    if (s == null) return null;
    return s.trim().isEmpty() ? null : s.trim();
  }

  private String normalizeWkt(String wkt) {
    if (wkt == null) return null;
    return wkt.replace(" ", "").toUpperCase();
  }
}
