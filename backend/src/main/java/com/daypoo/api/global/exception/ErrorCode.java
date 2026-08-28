package com.daypoo.api.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
  // Common
  INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력값입니다."),
  METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C002", "허용되지 않은 메서드입니다."),
  ENTITY_NOT_FOUND(HttpStatus.NOT_FOUND, "C003", "엔티티를 찾을 수 없습니다."),
  INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "서버 내부 오류입니다."),
  INVALID_TYPE_VALUE(HttpStatus.BAD_REQUEST, "C005", "잘못된 타입의 값입니다."),
  HANDLE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "C006", "접근 권한이 없습니다."),
  DUPLICATE_KEY(HttpStatus.CONFLICT, "C007", "중복된 데이터가 존재합니다."),
  TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "C008", "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요."),
  RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "C009", "요청한 리소스를 찾을 수 없습니다."),

  // User
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),
  NICKNAME_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "U003", "이미 존재하는 닉네임입니다."),
  INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U004", "비밀번호가 일치하지 않습니다."),
  INVALID_TOKEN(HttpStatus.BAD_REQUEST, "U005", "유효하지 않거나 만료된 토큰입니다."),
  EMAIL_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "U006", "이미 존재하는 이메일입니다."),

  // PooRecord
  STAY_TIME_NOT_MET(HttpStatus.BAD_REQUEST, "R005", "화장실 내 체류 시간이 충분하지 않습니다. (최소 60초)"),
  OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "R006", "화장실 반경 밖에서는 인증할 수 없습니다."),

  // Admin
  ADMIN_USER_NOT_FOUND(HttpStatus.NOT_FOUND, "A001", "사용자를 찾을 수 없습니다."),
  ADMIN_INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "A002", "문의를 찾을 수 없습니다."),
  ADMIN_INQUIRY_ALREADY_ANSWERED(HttpStatus.BAD_REQUEST, "A005", "이미 답변 완료된 문의입니다."),
  ADMIN_CANNOT_CHANGE_OWN_ROLE(HttpStatus.BAD_REQUEST, "A006", "자신의 역할은 변경할 수 없습니다."),
  ADMIN_CANNOT_DELETE_SELF(HttpStatus.BAD_REQUEST, "A008", "자신의 계정은 삭제할 수 없습니다."),

  // Toilet
  TOILET_NOT_FOUND(HttpStatus.NOT_FOUND, "T001", "화장실을 찾을 수 없습니다."),
  ALREADY_REVIEWED(HttpStatus.BAD_REQUEST, "T002", "이미 이 화장실에 대한 리뷰를 작성하셨습니다."),

  // Global Settings
  SIGNUP_DISABLED(HttpStatus.FORBIDDEN, "G001", "현재 신규 회원가입이 제한된 상태입니다."),
  MAINTENANCE_MODE(HttpStatus.SERVICE_UNAVAILABLE, "G002", "현재 시스템 점검 중입니다. 잠시 후 다시 시도해주세요.");

  private final HttpStatus status;
  private final String code;
  private final String message;

  ErrorCode(HttpStatus status, String code, String message) {
    this.status = status;
    this.code = code;
    this.message = message;
  }
}
