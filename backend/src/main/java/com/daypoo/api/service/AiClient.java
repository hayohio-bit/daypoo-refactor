package com.daypoo.api.service;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.AiMonthlyReportRequest;
import com.daypoo.api.dto.AiReportRequest;
import com.daypoo.api.dto.AiReviewSummaryRequest;
import com.daypoo.api.dto.AiReviewSummaryResponse;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class AiClient {
  private final RestTemplate restTemplate;

  public AiClient(@Qualifier("externalRestTemplate") RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  @Value("${ai-service.url}")
  private String aiServiceUrl;

  private static final String CORRELATION_ID_LOG_VAR_NAME = "correlationId";
  private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

  /** Python AI 서비스에 이미지를 보내 배변 상태 분석 요청 (Multipart 전송 방식) */
  @Retryable(
      maxAttempts = 2,
      backoff = @Backoff(delay = 1000),
      noRetryFor = {BusinessException.class})
  public AiAnalysisResponse analyzePoopImage(String base64Image) {
    String url = aiServiceUrl + "/api/v1/analysis/analyze";

    try {
      // 1. Base64 -> Byte Array 변환
      byte[] imageBytes =
          Base64.getDecoder()
              .decode(base64Image.contains(",") ? base64Image.split(",")[1] : base64Image);

      // 2. Multipart Body 생성
      MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
      ByteArrayResource resource =
          new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
              return "poop_image.jpg"; // 파일명 지정 필수
            }
          };
      body.add("image_file", resource);

      // 3. Headers 설정 (Multipart)
      HttpHeaders headers = createHeaders();
      headers.setContentType(MediaType.MULTIPART_FORM_DATA);

      HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

      log.info("Requesting Multipart AI analysis to {}", url);
      return restTemplate.postForObject(url, entity, AiAnalysisResponse.class);

    } catch (Exception e) {
      log.error("Failed to call AI Service (Multipart): {}", e.getMessage());
      throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
    }
  }

  /** Python AI 서비스에 기간별 기록 데이터를 보내 건강 리포트 생성 요청 */
  @Retryable(
      maxAttempts = 2,
      backoff = @Backoff(delay = 1000),
      noRetryFor = {BusinessException.class})
  public HealthReportResponse analyzeHealthReport(AiReportRequest request) {
    String url = aiServiceUrl + "/api/v1/report/generate";
    HttpEntity<AiReportRequest> entity = new HttpEntity<>(request, createHeaders());

    try {
      log.info(
          "Requesting AI report analysis for user {} ({})", request.userId(), request.reportType());
      return restTemplate.postForObject(url, entity, HealthReportResponse.class);
    } catch (Exception e) {
      log.error("Failed to call AI Report Service: {}", e.getMessage());
      throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
    }
  }

  /** Python AI 서비스에 4주 집계 데이터를 보내 MONTHLY 건강 리포트 생성 요청 */
  @Retryable(
      maxAttempts = 2,
      backoff = @Backoff(delay = 1000),
      noRetryFor = {BusinessException.class})
  public HealthReportResponse analyzeMonthlyReport(AiMonthlyReportRequest request) {
    String url = aiServiceUrl + "/api/v1/report/generate/monthly";
    HttpEntity<AiMonthlyReportRequest> entity = new HttpEntity<>(request, createHeaders());

    try {
      log.info(
          "Requesting AI monthly report analysis for user {} ({})",
          request.userId(),
          request.reportType());
      return restTemplate.postForObject(url, entity, HealthReportResponse.class);
    } catch (Exception e) {
      log.error("Failed to call AI Monthly Report Service: {}", e.getMessage());
      throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
    }
  }

  /** 화장실 리뷰 목록을 보내 AI 한 줄 요약 요청 */
  @Retryable(
      maxAttempts = 2,
      backoff = @Backoff(delay = 1000),
      noRetryFor = {BusinessException.class})
  public AiReviewSummaryResponse summarizeReviews(AiReviewSummaryRequest request) {
    String url = aiServiceUrl + "/api/v1/review/summarize";
    HttpEntity<AiReviewSummaryRequest> entity = new HttpEntity<>(request, createHeaders());

    try {
      log.info(
          "Requesting AI review summary for toilet {} ({})",
          request.toiletId(),
          request.toiletName());
      return restTemplate.postForObject(url, entity, AiReviewSummaryResponse.class);
    } catch (Exception e) {
      log.error("Failed to call AI Review Summary Service: {}", e.getMessage());
      // AI 호출 실패 시 비즈니스 로직에 큰 지장을 주지 않고 null이나 기본 메시지 처리할 수 있도록
      // 예외는 던지되, 호출부에서 적절히 처리하도록 권장
      throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
    }
  }

  private HttpHeaders createHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    String correlationId = MDC.get(CORRELATION_ID_LOG_VAR_NAME);
    if (correlationId != null) {
      headers.set(CORRELATION_ID_HEADER, correlationId);
    }
    return headers;
  }
}
