package com.daypoo.api.global.exception;

import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  /** 비즈니스 로직 예외 처리 */
  @ExceptionHandler(BusinessException.class)
  protected ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
    log.error("BusinessException: {}", e.getErrorCode().getMessage());
    ErrorCode errorCode = e.getErrorCode();
    ErrorResponse response = ErrorResponse.of(errorCode);
    return new ResponseEntity<>(response, errorCode.getStatus());
  }

  /**
   * @Valid 검증 예외 처리
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  protected ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
      MethodArgumentNotValidException e) {
    log.error("MethodArgumentNotValidException: {}", e.getMessage());
    List<ErrorResponse.FieldError> fieldErrors =
        e.getBindingResult().getFieldErrors().stream()
            .map(
                error ->
                    new ErrorResponse.FieldError(
                        error.getField(),
                        error.getRejectedValue() == null ? "" : error.getRejectedValue().toString(),
                        error.getDefaultMessage()))
            .collect(Collectors.toList());

    ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE, fieldErrors);
    return new ResponseEntity<>(response, ErrorCode.INVALID_INPUT_VALUE.getStatus());
  }

  /** 존재하지 않는 경로 요청 처리 (404) */
  @ExceptionHandler(NoResourceFoundException.class)
  protected ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException e) {
    log.warn("No resource found: {} {}", e.getHttpMethod(), e.getResourcePath());
    ErrorResponse response = ErrorResponse.of(ErrorCode.RESOURCE_NOT_FOUND);
    return new ResponseEntity<>(response, ErrorCode.RESOURCE_NOT_FOUND.getStatus());
  }

  /** 허용되지 않은 HTTP 메서드 요청 처리 (405) */
  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  protected ResponseEntity<ErrorResponse> handleMethodNotSupported(
      HttpRequestMethodNotSupportedException e) {
    log.warn("Method not supported: {}", e.getMessage());
    ErrorResponse response = ErrorResponse.of(ErrorCode.METHOD_NOT_ALLOWED);
    return new ResponseEntity<>(response, ErrorCode.METHOD_NOT_ALLOWED.getStatus());
  }

  /** 요청 파라미터 타입 불일치 처리 (400) */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  protected ResponseEntity<ErrorResponse> handleTypeMismatch(
      MethodArgumentTypeMismatchException e) {
    log.warn("Argument type mismatch: parameter '{}'", e.getName());
    ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_TYPE_VALUE);
    return new ResponseEntity<>(response, ErrorCode.INVALID_TYPE_VALUE.getStatus());
  }

  /** 필수 요청 파라미터 누락 처리 (400) */
  @ExceptionHandler(MissingServletRequestParameterException.class)
  protected ResponseEntity<ErrorResponse> handleMissingParameter(
      MissingServletRequestParameterException e) {
    log.warn("Missing request parameter: '{}'", e.getParameterName());
    ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE);
    return new ResponseEntity<>(response, ErrorCode.INVALID_INPUT_VALUE.getStatus());
  }

  /** 그 외 모든 예외 처리 */
  @ExceptionHandler(Exception.class)
  protected ResponseEntity<ErrorResponse> handleException(Exception e) {
    log.error("Unhandled Exception", e);
    ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR);
    return new ResponseEntity<>(response, ErrorCode.INTERNAL_SERVER_ERROR.getStatus());
  }

  /** OAuth2 인증 실패 예외 처리 */
  @ExceptionHandler(org.springframework.security.oauth2.core.OAuth2AuthenticationException.class)
  protected ResponseEntity<ErrorResponse> handleOAuth2AuthenticationException(
      org.springframework.security.oauth2.core.OAuth2AuthenticationException e) {
    log.error("OAuth2AuthenticationException: {}", e.getMessage());
    ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_TOKEN);
    return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
  }

  /** DB 제약 조건 위반 예외 처리 */
  @ExceptionHandler(DataIntegrityViolationException.class)
  protected ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException e) {
    log.error("DB constraint violation", e);
    return new ResponseEntity<>(ErrorResponse.of(ErrorCode.DUPLICATE_KEY), HttpStatus.CONFLICT);
  }

  /** 메시지 파싱 오류 예외 처리 */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  protected ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
      HttpMessageNotReadableException e) {
    log.error("Malformed request body", e);
    return new ResponseEntity<>(
        ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE), HttpStatus.BAD_REQUEST);
  }
}
