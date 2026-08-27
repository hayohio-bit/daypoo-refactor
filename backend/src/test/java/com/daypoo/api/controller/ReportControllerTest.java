package com.daypoo.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.daypoo.api.entity.User;
import com.daypoo.api.service.ReportService;
import com.daypoo.api.service.UserService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("리포트 컨트롤러 단위 테스트")
class ReportControllerTest {

  @InjectMocks private ReportController reportController;

  @Mock private ReportService reportService;
  @Mock private UserService userService;

  private static final String EMAIL = "user@daypoo.com";

  private User givenUser() {
    User user = mock(User.class);
    given(userService.getByEmail(EMAIL)).willReturn(user);
    return user;
  }

  @Test
  @DisplayName("히스토리 조회는 서비스에 위임한다")
  void getReportHistory_delegates() {
    User user = givenUser();
    given(reportService.getReportHistory(user)).willReturn(List.of());

    var response = reportController.getReportHistory(EMAIL);

    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).isEmpty();
  }

  @Test
  @DisplayName("트렌드 조회는 서비스에 위임한다")
  void getHealthTrend_delegates() {
    User user = givenUser();
    given(reportService.getHealthTrend(user)).willReturn(List.of(80, 70));

    var response = reportController.getHealthTrend(EMAIL);

    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).containsExactly(80, 70);
  }

  @Test
  @DisplayName("방문 패턴 조회는 서비스에 위임한다")
  void getVisitPatterns_delegates() {
    User user = givenUser();
    given(reportService.getVisitPatterns(user)).willReturn(List.of());

    var response = reportController.getVisitPatterns(EMAIL);

    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).isEmpty();
  }
}
