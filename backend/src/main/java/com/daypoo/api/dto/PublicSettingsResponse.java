package com.daypoo.api.dto;

import com.daypoo.api.entity.SystemSettings;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 인증 없이 노출해도 되는 시스템 설정값만 담는다.
 *
 * <p>{@link SystemSettingsResponse} 를 재사용하지 않는 이유는 그쪽에 점검 모드·회원가입 허용 여부 같은 운영 목적 필드가 함께 들어 있어서, 공개
 * 범위를 필드 단위로 통제할 수 없기 때문이다. 이 DTO 에 필드를 추가할 때는 비로그인 사용자에게 보여도 되는 값인지 먼저 판단한다.
 */
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class PublicSettingsResponse {

  private boolean noticeEnabled;

  /** 공지가 꺼져 있으면 null 이다. 관리자가 작성만 해 두고 아직 게시하지 않은 초안이 새어 나가지 않게 한다. */
  private String noticeMessage;

  public static PublicSettingsResponse from(SystemSettings entity) {
    boolean enabled = entity.isNoticeEnabled();
    return PublicSettingsResponse.builder()
        .noticeEnabled(enabled)
        .noticeMessage(enabled ? entity.getNoticeMessage() : null)
        .build();
  }

  public static PublicSettingsResponse disabled() {
    return PublicSettingsResponse.builder().noticeEnabled(false).noticeMessage(null).build();
  }
}
