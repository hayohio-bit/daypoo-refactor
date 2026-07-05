package com.daypoo.api.global.exception;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record ErrorResponse(
    String code, String message, int status, List<FieldError> errors, LocalDateTime timestamp) {
  public record FieldError(String field, String value, String reason) {}

  public static ErrorResponse of(ErrorCode errorCode) {
    return ErrorResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .status(errorCode.getStatus().value())
        .timestamp(LocalDateTime.now())
        .build();
  }

  public static ErrorResponse of(ErrorCode errorCode, List<FieldError> errors) {
    return ErrorResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .status(errorCode.getStatus().value())
        .errors(errors)
        .timestamp(LocalDateTime.now())
        .build();
  }
}
