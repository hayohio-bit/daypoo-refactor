package com.daypoo.api.simulation.seeder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

public class SeedDataGenerator {
  private static final Random random = new Random();

  private static final List<String> NAMES =
      List.of(
          "김철수", "이영희", "박지민", "최유진", "정민수", "강서윤", "조현우", "윤지호", "장서연", "임도현", "한승우", "오지은", "서준호",
          "신미나", "권동현", "황보라", "안성진", "송지아", "전우진", "홍예린");

  private static final List<String> REGIONS =
      List.of(
          "강남구 역삼동",
          "서초구 서초동",
          "송파구 잠실동",
          "마포구 서교동",
          "영등포구 여의도동",
          "종로구 관철동",
          "중구 명동",
          "용산구 이태원동",
          "강동구 천호동",
          "성동구 성수동");

  private static final List<String> COLORS = List.of("갈색", "황갈색", "진갈색", "녹색");

  private static final List<String> CONDITION_TAGS = List.of("쾌적", "보통", "복통", "설사", "변비", "가스");

  private static final List<String> DIET_TAGS =
      List.of("치킨", "피자", "커피", "샐러드", "삼겹살", "마라탕", "떡볶이");

  private static final List<String> REVIEW_COMMENTS =
      List.of(
          "깨끗해요!",
          "사람이 너무 많아요.",
          "칸이 넓어서 좋아요.",
          "휴지가 없네요.",
          "향기가 나요.",
          "조금 낡았지만 쓸만해요.",
          "급할 때 최고입니다.",
          "관리가 잘 안 되어 있어요.");

  public static String generateRandomName() {
    return NAMES.get(random.nextInt(NAMES.size())) + (random.nextInt(9000) + 1000);
  }

  public static String generateRandomRegion() {
    return REGIONS.get(random.nextInt(REGIONS.size()));
  }

  public static String generateRandomColor() {
    return COLORS.get(random.nextInt(COLORS.size()));
  }

  public static int generateRandomBristolScale() {
    // 3~5 가중치 (정상 범위)
    int r = random.nextInt(10);
    if (r < 7) return 3 + random.nextInt(3); // 70% 확률로 3, 4, 5
    return 1 + random.nextInt(7); // 30% 확률로 1~7
  }

  public static String generateRandomTags(List<String> pool, int max) {
    int count = random.nextInt(max) + 1;
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < count; i++) {
      if (i > 0) sb.append(",");
      sb.append(pool.get(random.nextInt(pool.size())));
    }
    return sb.toString();
  }

  public static String generateRandomConditionTags() {
    return generateRandomTags(CONDITION_TAGS, 2);
  }

  public static String generateRandomDietTags() {
    return generateRandomTags(DIET_TAGS, 3);
  }

  public static String generateRandomReviewComment() {
    return REVIEW_COMMENTS.get(random.nextInt(REVIEW_COMMENTS.size()));
  }

  public static LocalDateTime generateRandomDateTime(int daysAgo) {
    return LocalDateTime.now()
        .minusDays(random.nextInt(daysAgo + 1))
        .minusHours(random.nextInt(24))
        .minusMinutes(random.nextInt(60));
  }
}
