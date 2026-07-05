package com.daypoo.api.service;

import com.daypoo.api.dto.AiReportRequest;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.PooRecordRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthReportService {

  private final PooRecordRepository recordRepository;
  private final AiClient aiClient;

  /** 지난 7일간의 기록을 바탕으로 주간 리포트 생성 */
  @Transactional(readOnly = true)
  public HealthReportResponse getWeeklyReport(User user) {
    LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
    List<PooRecord> records =
        recordRepository.findAllByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, sevenDaysAgo);

    if (records.isEmpty()) {
      return HealthReportResponse.builder()
          .reportType("WEEKLY")
          .healthScore(0)
          .summary("지난 7일간의 기록이 없어 분석을 시작할 수 없습니다. 꾸준히 기록해 보세요!")
          .solution("기록을 더 많이 남겨주세요.")
          .insights(List.of("데이터가 부족합니다."))
          .analyzedAt(LocalDateTime.now().toString())
          .build();
    }

    // AI 분석에 필요한 데이터 가공
    List<AiReportRequest.PooRecordData> recordDataList =
        records.stream()
            .map(
                r ->
                    new AiReportRequest.PooRecordData(
                        r.getBristolScale(),
                        r.getColor(),
                        r.getConditionTags(),
                        r.getDietTags(),
                        r.getCreatedAt().toString()))
            .collect(Collectors.toList());

    AiReportRequest request =
        new AiReportRequest(user.getId().toString(), "WEEKLY", recordDataList, false);

    // AI 서비스 호출
    log.info("Requesting weekly AI report for user: {}", user.getEmail());
    return aiClient.analyzeHealthReport(request);
  }
}
