package com.daypoo.api.global.exception;

import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

  /** 그 외 모든 예외 처리 */
  @ExceptionHandler(Exception.class)
  protected ResponseEntity<ErrorResponse> handleException(Exception e) {
    log.error("Unhandled Exception", e);
    ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR);
    return new ResponseEntity<>(response, ErrorCode.INTERNAL_SERVER_ERROR.getStatus());
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
