// 인증 없이 조회할 수 있는 시스템 설정 타입

/** GET /api/v1/settings/public 의 응답. 백엔드 `PublicSettingsResponse` 와 대응한다. */
export interface PublicSettings {
  noticeEnabled: boolean;
  /** 공지가 꺼져 있으면 null 이다 (게시 전 초안을 노출하지 않기 위해 백엔드가 비운다). */
  noticeMessage: string | null;
}
