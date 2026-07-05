package com.daypoo.api.service;

import com.daypoo.api.global.GeometryUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Service
public class GeocodingService {
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;
  private final GeometryUtil geometryUtil;

  public GeocodingService(
      @Qualifier("externalRestTemplate") RestTemplate restTemplate,
      ObjectMapper objectMapper,
      GeometryUtil geometryUtil) {
    this.restTemplate = restTemplate;
    this.objectMapper = objectMapper;
    this.geometryUtil = geometryUtil;
  }

  @Value("${KAKAO_CLIENT_ID}") // REST API 키로 활용
  private String kakaoApiKey;

  private static final String KAKAO_GEOCODE_URL =
      "https://dapi.kakao.com/v2/local/search/address.json";
  private static final String KAKAO_REVERSE_GEOCODE_URL =
      "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json";

  /** 주소를 받아 위경도 좌표(Point)를 반환합니다. */
  @Retryable(maxAttempts = 2, backoff = @Backoff(delay = 1000))
  public Point geocodeAddress(String address) {
    if (address == null || address.trim().isEmpty()) {
      return null;
    }

    try {
      URI uri =
          UriComponentsBuilder.fromUriString(KAKAO_GEOCODE_URL)
              .queryParam("query", address)
              .build()
              .toUri();

      HttpHeaders headers = new HttpHeaders();
      headers.set("Authorization", "KakaoAK " + kakaoApiKey);
      HttpEntity<String> entity = new HttpEntity<>(headers);

      log.info("Requesting Kakao Geocoding for address: {}", address);
      ResponseEntity<String> response =
          restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

      JsonNode rootNode = objectMapper.readTree(response.getBody());
      JsonNode documents = rootNode.path("documents");

      if (documents.isArray() && !documents.isEmpty()) {
        JsonNode firstDoc = documents.get(0);
        double lon = firstDoc.path("x").asDouble(0.0);
        double lat = firstDoc.path("y").asDouble(0.0);

        if (lat != 0.0 && lon != 0.0) {
          return geometryUtil.createPoint(lon, lat);
        }
      }

      log.warn("No geocoding result found for address: {}", address);
      return null;

    } catch (Exception e) {
      log.error("Failed to geocode address: {}. Error: {}", address, e.getMessage());
      return null;
    }
  }

  /** 위경도 좌표를 받아 행정동 명칭(H)을 반환합니다. */
  @Retryable(maxAttempts = 2, backoff = @Backoff(delay = 1000))
  public String reverseGeocode(double lat, double lon) {
    try {
      URI uri =
          UriComponentsBuilder.fromUriString(KAKAO_REVERSE_GEOCODE_URL)
              .queryParam("x", lon)
              .queryParam("y", lat)
              .build()
              .toUri();

      HttpHeaders headers = new HttpHeaders();
      headers.set("Authorization", "KakaoAK " + kakaoApiKey);
      HttpEntity<String> entity = new HttpEntity<>(headers);

      log.info("Requesting Kakao Reverse Geocoding for coord: {}, {}", lat, lon);
      ResponseEntity<String> response =
          restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

      JsonNode rootNode = objectMapper.readTree(response.getBody());
      JsonNode documents = rootNode.path("documents");

      if (documents.isArray() && !documents.isEmpty()) {
        for (JsonNode doc : documents) {
          // 'H' (행정동) 타입을 우선적으로 반환합니다. (시/도 단위로 지역 랭킹 구분)
          if ("H".equals(doc.path("region_type").asText())) {
            return doc.path("region_2depth_name").asText("기타");
          }
        }
        // 행정동이 없으면 법정동(B) 등 첫 번째 결과를 반환
        return documents.get(0).path("region_2depth_name").asText("기타");
      }

      return "기타";

    } catch (Exception e) {
      log.error("Failed to reverse geocode: {}, {}. Error: {}", lat, lon, e.getMessage());
      return "기타";
    }
  }
}
