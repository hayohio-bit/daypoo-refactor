package com.daypoo.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.daypoo.api.dto.ToiletReviewCreateRequest;
import com.daypoo.api.dto.ToiletReviewPageResponse;
import com.daypoo.api.dto.ToiletReviewResponse;
import com.daypoo.api.dto.ToiletReviewSummaryResponse;
import com.daypoo.api.service.ToiletReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * ToiletReviewController Standalone MockMvc 테스트.
 * DB, Redis 등 외부 인프라 없이 컨트롤러 레이어만 단독 검증합니다.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("화장실 리뷰 컨트롤러 MockMvc 테스트")
class ToiletReviewControllerTest {

  private MockMvc mockMvc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Mock private ToiletReviewService toiletReviewService;

  @InjectMocks private ToiletReviewController toiletReviewController;

  // Authentication 파라미터를 가진 엔드포인트에서 사용할 mock principal
  private final UsernamePasswordAuthenticationToken mockAuthentication =
      new UsernamePasswordAuthenticationToken("test@example.com", null, Collections.emptyList());

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(toiletReviewController).build();
  }

  @Test
  @DisplayName("성공: 화장실 리뷰 작성 API")
  void createReview_success() throws Exception {
    // given
    // 실제 생성자: (Integer rating, List<String> emojiTags, String comment)
    ToiletReviewCreateRequest request =
        new ToiletReviewCreateRequest(4, List.of("😊"), "깨끗하고 좋았습니다.");
    ToiletReviewResponse response =
        ToiletReviewResponse.builder()
            .id(1L)
            .userName("PoopKing")
            .rating(4)
            .emojiTags(List.of("😊"))
            .comment("깨끗하고 좋았습니다.")
            .helpfulCount(0)
            .createdAt(LocalDateTime.now())
            .build();

    given(
            toiletReviewService.createReview(
                eq("test@example.com"), eq(10L), any(ToiletReviewCreateRequest.class)))
        .willReturn(response);

    // when & then
    // Authentication 파라미터는 UsernamePasswordAuthenticationToken으로 주입
    mockMvc
        .perform(
            post("/api/v1/toilets/{toiletId}/reviews", 10L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .principal(mockAuthentication))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1L))
        .andExpect(jsonPath("$.rating").value(4))
        .andExpect(jsonPath("$.comment").value("깨끗하고 좋았습니다."));
  }

  @Test
  @DisplayName("성공: 최근 리뷰 5개 조회 API")
  void getRecentReviews_success() throws Exception {
    // given
    ToiletReviewResponse response =
        ToiletReviewResponse.builder()
            .id(1L)
            .userName("PoopKing")
            .rating(4)
            .emojiTags(List.of("😊"))
            .comment("괜찮은 화장실")
            .helpfulCount(0)
            .createdAt(LocalDateTime.now())
            .build();

    given(toiletReviewService.getRecentReviews(10L)).willReturn(Collections.singletonList(response));

    // when & then
    mockMvc
        .perform(
            get("/api/v1/toilets/{toiletId}/reviews/recent", 10L)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].comment").value("괜찮은 화장실"));
  }

  @Test
  @DisplayName("성공: 전체 리뷰 페이징 조회 API")
  void getReviewsWithPaging_success() throws Exception {
    // given
    ToiletReviewResponse review =
        ToiletReviewResponse.builder()
            .id(1L)
            .userName("PoopKing")
            .rating(4)
            .emojiTags(List.of("😊"))
            .comment("페이징 테스트")
            .helpfulCount(0)
            .createdAt(LocalDateTime.now())
            .build();

    // 실제 레코드 순서: (contents, totalElements, totalPages, currentPage, hasNext)
    ToiletReviewPageResponse pageResponse =
        new ToiletReviewPageResponse(Collections.singletonList(review), 1L, 1, 0, false);

    given(toiletReviewService.getReviewsWithPaging(10L, 0, 10, "latest")).willReturn(pageResponse);

    // when & then
    mockMvc
        .perform(
            get("/api/v1/toilets/{toiletId}/reviews", 10L)
                .param("page", "0")
                .param("size", "10")
                .param("sort", "latest")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.contents[0].comment").value("페이징 테스트"))
        .andExpect(jsonPath("$.totalElements").value(1));
  }

  @Test
  @DisplayName("성공: 리뷰 요약 정보 조회 API")
  void getReviewSummary_success() throws Exception {
    // given
    // 실제 레코드 순서: (aiSummary, avgRating, reviewCount, recentReviews)
    ToiletReviewSummaryResponse summaryResponse =
        new ToiletReviewSummaryResponse("리뷰 요약 한줄평입니다.", 4.2, 5, Collections.emptyList());

    given(toiletReviewService.getReviewSummary(10L)).willReturn(summaryResponse);

    // when & then
    mockMvc
        .perform(
            get("/api/v1/toilets/{toiletId}/reviews/summary", 10L)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.avgRating").value(4.2))
        .andExpect(jsonPath("$.aiSummary").value("리뷰 요약 한줄평입니다."));
  }
}
