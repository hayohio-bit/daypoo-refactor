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

  // User
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),
  USERNAME_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "U002", "이미 존재하는 아이디입니다."),
  NICKNAME_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "U003", "이미 존재하는 닉네임입니다."),
  INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U004", "비밀번호가 일치하지 않습니다."),
  INVALID_TOKEN(HttpStatus.BAD_REQUEST, "U005", "유효하지 않거나 만료된 토큰입니다."),
  EMAIL_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "U006", "이미 존재하는 이메일입니다."),

  // Shop
  INSUFFICIENT_POINTS(HttpStatus.BAD_REQUEST, "S001", "포인트가 부족합니다."),
  ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "S002", "아이템을 찾을 수 없습니다."),
  ALREADY_OWNED_ITEM(HttpStatus.BAD_REQUEST, "S003", "이미 보유 중인 아이템입니다."),
  NOT_OWNED_TITLE(HttpStatus.BAD_REQUEST, "S004", "보유하지 않은 칭호입니다."),

  // PooRecord
  LOCATION_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "R001", "화장실 반경 밖에서는 인증할 수 없습니다."),
  COOLDOWN_ACTIVE(HttpStatus.BAD_REQUEST, "R002", "이미 최근 인증을 완료한 화장실입니다."),
  AI_SERVICE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "R003", "AI 분석 서비스 호출에 실패했습니다."),
  NO_RECORDS_FOR_REPORT(HttpStatus.BAD_REQUEST, "R004", "분석할 배변 기록이 없습니다."),
  STAY_TIME_NOT_MET(HttpStatus.BAD_REQUEST, "R005", "화장실 내 체류 시간이 충분하지 않습니다. (최소 60초)"),
  OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "R006", "화장실 반경 밖에서는 인증할 수 없습니다."),
  NOT_POOP_IMAGE(HttpStatus.BAD_REQUEST, "R007", "똥 사진이 아닌 것 같아요! 변기 안의 변을 촬영해주세요."),

  // Admin
  ADMIN_USER_NOT_FOUND(HttpStatus.NOT_FOUND, "A001", "사용자를 찾을 수 없습니다."),
  ADMIN_INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "A002", "문의를 찾을 수 없습니다."),
  ADMIN_TOILET_NOT_FOUND(HttpStatus.NOT_FOUND, "A003", "화장실을 찾을 수 없습니다."),
  ADMIN_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "A004", "아이템을 찾을 수 없습니다."),
  ADMIN_INQUIRY_ALREADY_ANSWERED(HttpStatus.BAD_REQUEST, "A005", "이미 답변 완료된 문의입니다."),
  ADMIN_CANNOT_CHANGE_OWN_ROLE(HttpStatus.BAD_REQUEST, "A006", "자신의 역할은 변경할 수 없습니다."),
  ADMIN_ITEM_IN_USE(HttpStatus.CONFLICT, "A007", "유저가 보유 중인 아이템은 삭제할 수 없습니다."),
  ADMIN_CANNOT_DELETE_SELF(HttpStatus.BAD_REQUEST, "A008", "자신의 계정은 삭제할 수 없습니다."),
  ADMIN_TITLE_NOT_FOUND(HttpStatus.NOT_FOUND, "A009", "칭호를 찾을 수 없습니다."),
  ADMIN_TITLE_IN_USE(HttpStatus.CONFLICT, "A010", "유저가 획득한 칭호는 삭제할 수 없습니다."),
  ADMIN_TITLE_NAME_DUPLICATE(HttpStatus.CONFLICT, "A011", "이미 존재하는 칭호 이름입니다."),

  // Toilet
  TOILET_NOT_FOUND(HttpStatus.NOT_FOUND, "T001", "화장실을 찾을 수 없습니다."),
  ALREADY_REVIEWED(HttpStatus.BAD_REQUEST, "T002", "이미 이 화장실에 대한 리뷰를 작성하셨습니다."),

  // Subscription
  SUBSCRIPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "B001", "구독 정보를 찾을 수 없습니다."),

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
