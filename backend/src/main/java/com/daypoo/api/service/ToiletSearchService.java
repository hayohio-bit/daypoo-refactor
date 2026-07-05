package com.daypoo.api.service;

import com.daypoo.api.dto.ToiletSearchResultResponse;
import com.daypoo.api.util.ChosungUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToiletSearchService {

  private static final String INDEX_NAME = "toilets_v2";
  private static final String GEO_FILTER_DISTANCE = "20km";

  private final WebClient.Builder webClientBuilder;
  private final ObjectMapper objectMapper;

  @Value("${opensearch.url}")
  private String opensearchUrl;

  /**
   * 화장실 이름/주소 텍스트 검색 (초성 n-gram 검색 지원)
   *
   * @param query 검색어 (일반 한글 또는 초성만)
   * @param size 최대 결과 개수
   */
  public List<ToiletSearchResultResponse> search(
      String query, int size, Double latitude, Double longitude) {
    if (query == null || query.isBlank()) return List.of();

    boolean hasLocation = latitude != null && longitude != null;

    // 1차: 위치 반경 필터 + 매칭 → Java 거리순 정렬
    if (hasLocation) {
      try {
        String requestBody = buildQuery(query.trim(), size * 3, latitude, longitude);
        String response = executeSearch(requestBody);
        List<ToiletSearchResultResponse> results = parseResponse(response);
        if (!results.isEmpty()) {
          return sortByDistance(results, latitude, longitude, size);
        }
      } catch (Exception e) {
        log.warn(
            "[OpenSearch] geo_distance 필터 실패, 전체 검색으로 재시도. query='{}': {}", query, e.getMessage());
      }
    }

    // 2차: 필터 없이 전체 매칭 → Java 거리순 정렬 (반경 내 결과 없거나 필터 실패 시)
    try {
      int fetchSize = hasLocation ? 200 : size;
      String requestBody = buildQuery(query.trim(), fetchSize, null, null);
      String response = executeSearch(requestBody);
      List<ToiletSearchResultResponse> results = parseResponse(response);
      if (hasLocation) {
        return sortByDistance(results, latitude, longitude, size);
      }
      return results;
    } catch (Exception e) {
      log.error("[OpenSearch] 검색 완전 실패 query='{}': {}", query, e.getMessage());
      return List.of();
    }
  }

  private String executeSearch(String requestBody) {
    return webClientBuilder
        .build()
        .post()
        .uri(opensearchUrl + "/" + INDEX_NAME + "/_search")
        .header("Content-Type", "application/json")
        .bodyValue(requestBody)
        .retrieve()
        .bodyToMono(String.class)
        .block();
  }

  // ── private helpers ──────────────────────────────────────────────────────

  private String buildQuery(String query, int size, Double latitude, Double longitude)
      throws Exception {
    boolean isChosung = ChosungUtils.isChosungOnly(query);
    String chosungQuery = ChosungUtils.extractChosung(query);
    boolean hasLocation = latitude != null && longitude != null;

    List<Object> shouldClauses = new ArrayList<>();

    if (isChosung) {
      // 순수 초성 검색: n-gram 배열 term 조회만 사용
      shouldClauses.add(Map.of("term", Map.of("nameChosungNgrams", chosungQuery)));
    } else {
      // 일반 텍스트 검색: 텍스트 매칭만 사용 (초성 혼용 금지)
      shouldClauses.add(
          Map.of(
              "multi_match",
              Map.of("query", query, "fields", List.of("name", "address"), "type", "best_fields")));
      shouldClauses.add(Map.of("match_phrase_prefix", Map.of("name", Map.of("query", query))));
    }

    java.util.LinkedHashMap<String, Object> boolQuery = new java.util.LinkedHashMap<>();
    boolQuery.put("should", shouldClauses);
    boolQuery.put("minimum_should_match", 1);

    // 위치 반경 필터 (geo_distance) - 검색 대상을 근거리로 제한
    if (hasLocation) {
      boolQuery.put(
          "filter",
          List.of(
              Map.of(
                  "geo_distance",
                  Map.of(
                      "distance",
                      GEO_FILTER_DISTANCE,
                      "location",
                      Map.of("lat", latitude, "lon", longitude)))));
    }

    java.util.LinkedHashMap<String, Object> queryBody = new java.util.LinkedHashMap<>();
    queryBody.put("query", Map.of("bool", boolQuery));
    queryBody.put("size", size);

    return objectMapper.writeValueAsString(queryBody);
  }

  private List<ToiletSearchResultResponse> sortByDistance(
      List<ToiletSearchResultResponse> results, double latitude, double longitude, int size) {
    results.sort(
        Comparator.comparingDouble(
            r -> haversine(latitude, longitude, r.latitude(), r.longitude())));
    return results.subList(0, Math.min(size, results.size()));
  }

  private List<ToiletSearchResultResponse> parseResponse(String responseJson) throws Exception {
    JsonNode root = objectMapper.readTree(responseJson);
    JsonNode hits = root.path("hits").path("hits");

    List<ToiletSearchResultResponse> results = new ArrayList<>();
    for (JsonNode hit : hits) {
      JsonNode src = hit.path("_source");
      results.add(
          ToiletSearchResultResponse.builder()
              .id(src.path("id").asLong())
              .name(src.path("name").asText(""))
              .address(src.path("address").asText(""))
              .latitude(src.path("latitude").asDouble())
              .longitude(src.path("longitude").asDouble())
              .build());
    }
    return results;
  }

  private double haversine(double lat1, double lon1, double lat2, double lon2) {
    final double R = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2)
                * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
