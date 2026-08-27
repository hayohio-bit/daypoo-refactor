package com.daypoo.api.global.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@DisplayName("전역 예외 처리기 단위 테스트")
class GlobalExceptionHandlerTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  @DisplayName("존재하지 않는 경로 요청은 500이 아니라 404(C009)로 응답한다")
  void noResourceFound_returns404() {
    // given
    NoResourceFoundException e =
        new NoResourceFoundException(HttpMethod.GET, "api/v1/unknown-path");

    // when
    ResponseEntity<ErrorResponse> response = handler.handleNoResourceFound(e);

    // then
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().code()).isEqualTo("C009");
    assertThat(response.getBody().status()).isEqualTo(404);
  }

  @Test
  @DisplayName("허용되지 않은 HTTP 메서드 요청은 405(C002)로 응답한다")
  void methodNotSupported_returns405() {
    // given
    HttpRequestMethodNotSupportedException e = new HttpRequestMethodNotSupportedException("DELETE");

    // when
    ResponseEntity<ErrorResponse> response = handler.handleMethodNotSupported(e);

    // then
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().code()).isEqualTo("C002");
  }

  @Test
  @DisplayName("요청 파라미터 타입 불일치는 400(C005)로 응답한다")
  void typeMismatch_returns400() {
    // given
    MethodArgumentTypeMismatchException e = mock(MethodArgumentTypeMismatchException.class);
    given(e.getName()).willReturn("latitude");

    // when
    ResponseEntity<ErrorResponse> response = handler.handleTypeMismatch(e);

    // then
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().code()).isEqualTo("C005");
  }

  @Test
  @DisplayName("필수 요청 파라미터 누락은 400(C001)로 응답한다")
  void missingParameter_returns400() {
    // given
    MissingServletRequestParameterException e =
        new MissingServletRequestParameterException("latitude", "double");

    // when
    ResponseEntity<ErrorResponse> response = handler.handleMissingParameter(e);

    // then
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().code()).isEqualTo("C001");
  }

  @Test
  @DisplayName("분류되지 않은 예외는 여전히 500(C004)로 응답한다")
  void unhandledException_returns500() {
    // when
    ResponseEntity<ErrorResponse> response = handler.handleException(new RuntimeException("boom"));

    // then
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().code()).isEqualTo("C004");
  }
}
