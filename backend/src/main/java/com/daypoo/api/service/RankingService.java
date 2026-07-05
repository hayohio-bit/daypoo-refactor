package com.daypoo.api.service;

import com.daypoo.api.dto.EquippedItemResponse;
import com.daypoo.api.dto.RankingResponse;
import com.daypoo.api.dto.UserRankResponse;
import com.daypoo.api.dto.UserRegionScoreProjection;
import com.daypoo.api.dto.UserScoreProjection;
import com.daypoo.api.entity.HealthReportSnapshot;
import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.HealthReportSnapshotRepository;
import com.daypoo.api.repository.InventoryRepository;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.TitleRepository;
import com.daypoo.api.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

  private final StringRedisTemplate redisTemplate;
  private final UserRepository userRepository;
  private final TitleRepository titleRepository;
  private final PooRecordRepository recordRepository;
  private final HealthReportSnapshotRepository snapshotRepository;
  private final InventoryRepository inventoryRepository;

  private static final String GLOBAL_RANK_KEY = "daypoo:rankings:global";
  private static final String HEALTH_RANK_KEY = "daypoo:rankings:health";
  private static final String REGION_RANK_KEY_PREFIX = "daypoo:rankings:region:";

  public void updateGlobalRank(User user) {
    if (user != null && user.getId() != null) {
      long recordCount = recordRepository.countByUser(user);
      long uniqueToilets = recordRepository.countDistinctToiletsByUser(user);
      double score = recordCount + uniqueToilets * 3.0;
      redisTemplate.opsForZSet().add(GLOBAL_RANK_KEY, user.getId().toString(), score);
    }
  }

  public void updateHealthRank(User user, double healthScore) {
    if (user != null && user.getId() != null) {
      redisTemplate.opsForZSet().add(HEALTH_RANK_KEY, user.getId().toString(), healthScore);
    }
  }

  public void updateRegionRank(User user, String regionName) {
    if (user != null && user.getId() != null) {
      long recordCount = recordRepository.countByUserAndRegionName(user, regionName);
      long uniqueToilets =
          recordRepository.countDistinctToiletsByUserAndRegionName(user, regionName);
      double score = recordCount + uniqueToilets * 3.0;
      if (score <= 0) return;
      String key = REGION_RANK_KEY_PREFIX + regionName;
      redisTemplate.opsForZSet().add(key, user.getId().toString(), score);
    }
  }

  public RankingResponse getGlobalRanking(User myUser) {
    checkAndInitialize(GLOBAL_RANK_KEY);
    return getRankingFromRedis(GLOBAL_RANK_KEY, myUser);
  }

  public RankingResponse getHealthRanking(User myUser) {
    checkAndInitialize(HEALTH_RANK_KEY);
    return getRankingFromRedis(HEALTH_RANK_KEY, myUser);
  }

  public RankingResponse getRegionRanking(User myUser, String regionName) {
    String key = REGION_RANK_KEY_PREFIX + regionName;
    checkAndInitialize(key);
    return getRankingFromRedis(key, myUser);
  }

  @EventListener(ApplicationReadyEvent.class)
  public void onApplicationReady() {
    log.info("[Ranking] ApplicationReadyEvent: 랭킹 재구축 수행");
    rebuildAllRankings();
  }

  @Scheduled(cron = "0 0 4 * * *")
  public void scheduledRankingRebuild() {
    log.info("[Ranking] 스케줄 랭킹 재구축 수행 (매일 04:00)");
    rebuildAllRankings();
  }

  public void rebuildAllRankings() {
    String lockKey = "daypoo:lock:rebuild_rankings";
    // 5분 동안 유효한 분산 락 획득 시도
    Boolean acquired =
        redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", java.time.Duration.ofMinutes(5));
    if (acquired == null || !acquired) {
      log.info("[Ranking] 이미 다른 프로세스에서 랭킹 재구축 중입니다. 스킵합니다.");
      return;
    }

    try {
      log.info("[Ranking] 전체 랭킹 재구축 시작 (Atomically)...");

      // 1. 전체 랭킹 (Global) - 임시 키 사용 후 RENAME
      String tempGlobalKey = GLOBAL_RANK_KEY + ":rebuilding";
      List<UserScoreProjection> globalScores = recordRepository.findAllGlobalScores();
      for (UserScoreProjection p : globalScores) {
        double score = p.getRecordCount() + p.getUniqueToilets() * 3.0;
        redisTemplate.opsForZSet().add(tempGlobalKey, p.getUserId().toString(), score);
      }
      redisTemplate.rename(tempGlobalKey, GLOBAL_RANK_KEY);
      log.info("[Ranking] 전체 랭킹 재구축 완료 (Atomically)");

      // 2. 지역 랭킹 (Region) - 임시 키 사용 후 RENAME
      List<UserRegionScoreProjection> regionScores = recordRepository.findAllRegionScores();
      java.util.Map<String, List<UserRegionScoreProjection>> groupedByRegion =
          regionScores.stream()
              .collect(Collectors.groupingBy(UserRegionScoreProjection::getRegionName));

      for (java.util.Map.Entry<String, List<UserRegionScoreProjection>> entry :
          groupedByRegion.entrySet()) {
        String regionName = entry.getKey();
        String targetKey = REGION_RANK_KEY_PREFIX + regionName;
        String tempKey = targetKey + ":rebuilding";

        for (UserRegionScoreProjection p : entry.getValue()) {
          double score = p.getRecordCount() + p.getUniqueToilets() * 3.0;
          if (score > 0) {
            redisTemplate.opsForZSet().add(tempKey, p.getUserId().toString(), score);
          }
        }
        redisTemplate.rename(tempKey, targetKey);
      }
      log.info("[Ranking] 지역 랭킹 재구축 완료 (Atomically)");

      // 3. 건강왕 (Health) - 임시 키 사용 후 RENAME
      String tempHealthKey = HEALTH_RANK_KEY + ":rebuilding";
      LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
      LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
      List<HealthReportSnapshot> snapshots =
          snapshotRepository.findTodayDailySnapshots(startOfDay, endOfDay);
      for (HealthReportSnapshot snapshot : snapshots) {
        redisTemplate
            .opsForZSet()
            .add(tempHealthKey, snapshot.getUser().getId().toString(), snapshot.getHealthScore());
      }
      redisTemplate.rename(tempHealthKey, HEALTH_RANK_KEY);
      log.info("[Ranking] 건강왕 랭킹 재구축 완료 (Atomically)");

    } catch (Exception e) {
      log.error("[Ranking] 랭킹 재구축 중 오류 발생: {}", e.getMessage(), e);
    } finally {
      // 락 해제
      redisTemplate.delete(lockKey);
      log.info("[Ranking] 랭킹 재구축 프로세스 종료.");
    }
  }

  public RankingResponse getGlobalRanking() {
    return getGlobalRanking(null);
  }

  private void checkAndInitialize(String key) {
    Long size = redisTemplate.opsForZSet().size(key);
    if (size == null || size == 0) {
      log.info("Redis [Ranking] empty: initializing for key {}", key);
      if (key.equals(HEALTH_RANK_KEY)) {
        initializeHealthRanking();
      } else if (key.equals(GLOBAL_RANK_KEY)) {
        List<UserScoreProjection> scores = recordRepository.findAllGlobalScores();
        for (UserScoreProjection p : scores) {
          double score = p.getRecordCount() + p.getUniqueToilets() * 3.0;
          redisTemplate.opsForZSet().add(GLOBAL_RANK_KEY, p.getUserId().toString(), score);
        }
      } else if (key.startsWith(REGION_RANK_KEY_PREFIX)) {
        String region = key.replace(REGION_RANK_KEY_PREFIX, "");
        List<UserRegionScoreProjection> scores = recordRepository.findAllRegionScores();
        for (UserRegionScoreProjection p : scores) {
          if (!region.equals(p.getRegionName())) continue;
          double score = p.getRecordCount() + p.getUniqueToilets() * 3.0;
          if (score <= 0) continue;
          redisTemplate.opsForZSet().add(key, p.getUserId().toString(), score);
        }
      }
    }
  }

  private void initializeHealthRanking() {
    LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
    LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
    List<HealthReportSnapshot> snapshots =
        snapshotRepository.findTodayDailySnapshots(startOfDay, endOfDay);
    for (HealthReportSnapshot snapshot : snapshots) {
      updateHealthRank(snapshot.getUser(), snapshot.getHealthScore());
    }
  }

  private String extractAvatarUrl(List<EquippedItemResponse> items) {
    return items.stream()
        .filter(item -> "AVATAR".equals(item.type()))
        .map(EquippedItemResponse::icon)
        .findFirst()
        .orElse(null);
  }

  private RankingResponse getRankingFromRedis(String key, User myUser) {
    Set<ZSetOperations.TypedTuple<String>> topRankersRaw =
        redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, 9);

    Long activeUserCount = redisTemplate.opsForZSet().size(key);
    if (activeUserCount == null) {
      activeUserCount = 0L;
    }

    if (topRankersRaw == null || topRankersRaw.isEmpty()) {
      return RankingResponse.builder()
          .topRankers(new ArrayList<>())
          .myRank(null)
          .activeUserCount(activeUserCount)
          .build();
    }

    // N+1 Optimization: Batch fetch users and titles
    List<Long> userIds =
        topRankersRaw.stream()
            .map(tuple -> Long.valueOf(Objects.requireNonNull(tuple.getValue())))
            .collect(Collectors.toList());

    List<User> users = userRepository.findAllById(userIds);
    java.util.Map<Long, User> userMap =
        users.stream().collect(Collectors.toMap(User::getId, u -> u));

    java.util.Set<Long> titleIds =
        users.stream()
            .map(User::getEquippedTitleId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

    if (myUser != null && myUser.getEquippedTitleId() != null) {
      titleIds.add(myUser.getEquippedTitleId());
    }

    java.util.Map<Long, String> titleMap =
        titleRepository.findAllById(titleIds).stream()
            .collect(Collectors.toMap(Title::getId, Title::getName));

    // Batch-fetch equipped items for all top rankers and current user
    List<User> usersForInventory = new ArrayList<>(users);
    if (myUser != null && !userMap.containsKey(myUser.getId())) {
      usersForInventory.add(myUser);
    }

    java.util.Map<Long, List<EquippedItemResponse>> equippedItemsMap =
        usersForInventory.isEmpty()
            ? java.util.Map.of()
            : inventoryRepository.findEquippedByUserIn(usersForInventory).stream()
                .collect(
                    Collectors.groupingBy(
                        inv -> inv.getUser().getId(),
                        Collectors.mapping(
                            inv ->
                                EquippedItemResponse.of(
                                    inv.getItem().getImageUrl(),
                                    inv.getItem().getName(),
                                    inv.getItem().getType().name(),
                                    inv.getItem().getId()),
                            Collectors.toList())));

    List<ZSetOperations.TypedTuple<String>> topRankersList = new ArrayList<>(topRankersRaw);
    List<UserRankResponse> topRankers = new ArrayList<>();

    for (int i = 0; i < topRankersList.size(); i++) {
      ZSetOperations.TypedTuple<String> tuple = topRankersList.get(i);
      Long userId = Long.valueOf(Objects.requireNonNull(tuple.getValue()));
      User user = userMap.get(userId);
      if (user == null) continue;

      // N+1 Optimization: topRankersRaw is already sorted (0 to 9), so index 'i' is exactly the
      // reverseRank!
      Long rank = (long) i;

      String titleName =
          user.getEquippedTitleId() != null ? titleMap.get(user.getEquippedTitleId()) : null;

      List<EquippedItemResponse> equippedItems = equippedItemsMap.getOrDefault(userId, List.of());
      String equippedAvatarUrl = extractAvatarUrl(equippedItems);

      topRankers.add(
          UserRankResponse.builder()
              .userId(userId)
              .nickname(user.getNickname())
              .titleName(titleName)
              .level(user.getLevel())
              .score(tuple.getScore() != null ? tuple.getScore().longValue() : 0L)
              .rank(rank + 1L)
              .equippedItems(equippedItems)
              .equippedAvatarUrl(equippedAvatarUrl)
              .build());
    }

    UserRankResponse myRank = null;
    if (myUser != null && myUser.getId() != null) {
      Long myRankRaw = redisTemplate.opsForZSet().reverseRank(key, myUser.getId().toString());
      if (myRankRaw != null) {
        Double myScoreRaw = redisTemplate.opsForZSet().score(key, myUser.getId().toString());
        String myTitleName =
            myUser.getEquippedTitleId() != null ? titleMap.get(myUser.getEquippedTitleId()) : null;

        List<EquippedItemResponse> myEquippedItems =
            equippedItemsMap.getOrDefault(myUser.getId(), List.of());
        String myEquippedAvatarUrl = extractAvatarUrl(myEquippedItems);

        myRank =
            UserRankResponse.builder()
                .userId(myUser.getId())
                .nickname(myUser.getNickname())
                .titleName(myTitleName)
                .level(myUser.getLevel())
                .score(myScoreRaw != null ? myScoreRaw.longValue() : 0L)
                .rank(myRankRaw + 1L)
                .equippedItems(myEquippedItems)
                .equippedAvatarUrl(myEquippedAvatarUrl)
                .build();
      }
    }

    return RankingResponse.builder()
        .topRankers(topRankers)
        .myRank(myRank)
        .activeUserCount(activeUserCount)
        .build();
  }
}
