package com.daypoo.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import com.daypoo.api.dto.AdminToiletListResponse;
import com.daypoo.api.service.AdminManagementService;
import com.daypoo.api.service.ToiletIndexingService;
import com.daypoo.api.service.ToiletReviewService;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
@DisplayName("관리자 화장실 컨트롤러 단위 테스트")
class AdminToiletControllerTest {

  @InjectMocks private AdminToiletController adminToiletController;

  @Mock private AdminManagementService adminManagementService;
  @Mock private ToiletReviewService toiletReviewService;
  @Mock private ToiletIndexingService toiletIndexingService;

  @Test
  @DisplayName("성공: 화장실 목록 조회 및 검색 위임 확인")
  void getToilets_success() {
    // given
    AdminToiletListResponse toiletResponse =
        AdminToiletListResponse.builder()
            .id(1L)
            .name("테스트 화장실")
            .address("서울시 강남구")
            .openHours("24시간")
            .is24h(true)
            .isUnisex(false)
            .createdAt(LocalDateTime.now())
            .build();

    Pageable pageable = PageRequest.of(0, 20);
    given(adminManagementService.getToilets(any(), any(Pageable.class)))
        .willReturn(new PageImpl<>(Collections.singletonList(toiletResponse)));

    // when
    ResponseEntity<Page<AdminToiletListResponse>> response =
        adminToiletController.getToilets("테스트", pageable);

    // then
    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    Page<AdminToiletListResponse> body = response.getBody();
    assertThat(body).isNotNull();
    assertThat(body.getContent()).hasSize(1);
    assertThat(body.getContent().get(0).name()).isEqualTo("테스트 화장실");
    verify(adminManagementService, times(1)).getToilets(eq("테스트"), eq(pageable));
  }

  @Test
  @DisplayName("성공: OpenSearch 인덱싱 강제 실행 위임 확인")
  void reindex_success() {
    // when
    ResponseEntity<String> response = adminToiletController.reindex();

    // then
    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).contains("Force re-indexing started");
    verify(toiletIndexingService, times(1)).forceReindex();
  }

  @Test
  @DisplayName("성공: 인덱스 개수 조회 위임 확인")
  void getCount_success() {
    // given
    given(toiletIndexingService.getIndexedCount()).willReturn(150L);

    // when
    ResponseEntity<Long> response = adminToiletController.getCount();

    // then
    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).isEqualTo(150L);
    verify(toiletIndexingService, times(1)).getIndexedCount();
  }

  @Test
  @DisplayName("성공: AI 리뷰 요약 일괄 생성 위임 확인")
  void generateAiSummaries_success() {
    // given
    given(toiletReviewService.generateMissingAiSummaries()).willReturn(5);

    // when
    ResponseEntity<Map<String, Object>> response = adminToiletController.generateAiSummaries();

    // then
    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("generated")).isEqualTo(5);
    verify(toiletReviewService, times(1)).generateMissingAiSummaries();
  }
}
