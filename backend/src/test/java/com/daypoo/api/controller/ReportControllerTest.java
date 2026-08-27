package com.daypoo.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
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

  private User givenUser(boolean isPro) {
    User user = mock(User.class);
    given(user.isPro()).willReturn(isPro);
    given(userService.getByEmail(EMAIL)).willReturn(user);
    return user;
  }

  @Test
  @DisplayName("PRO가 아닌 사용자의 히스토리 조회는 403(B002) BusinessException을 던진다")
  void getReportHistory_notPro_throwsForbidden() {
    givenUser(false);

    assertThatThrownBy(() -> reportController.getReportHistory(EMAIL))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.PRO_MEMBERSHIP_REQUIRED);
    verifyNoInteractions(reportService);
  }

  @Test
  @DisplayName("PRO가 아닌 사용자의 트렌드 조회는 403(B002) BusinessException을 던진다")
  void getHealthTrend_notPro_throwsForbidden() {
    givenUser(false);

    assertThatThrownBy(() -> reportController.getHealthTrend(EMAIL))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.PRO_MEMBERSHIP_REQUIRED);
    verifyNoInteractions(reportService);
  }

  @Test
  @DisplayName("PRO가 아닌 사용자의 방문 패턴 조회는 403(B002) BusinessException을 던진다")
  void getVisitPatterns_notPro_throwsForbidden() {
    givenUser(false);

    assertThatThrownBy(() -> reportController.getVisitPatterns(EMAIL))
        .isInstanceOf(BusinessException.class)
        .extracting(e -> ((BusinessException) e).getErrorCode())
        .isEqualTo(ErrorCode.PRO_MEMBERSHIP_REQUIRED);
    verifyNoInteractions(reportService);
  }

  @Test
  @DisplayName("PRO 사용자의 히스토리 조회는 서비스에 위임한다")
  void getReportHistory_pro_delegates() {
    User user = givenUser(true);
    given(reportService.getReportHistory(user)).willReturn(List.of());

    var response = reportController.getReportHistory(EMAIL);

    assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(response.getBody()).isEmpty();
  }
}
