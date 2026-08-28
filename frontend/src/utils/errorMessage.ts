/** 어떤 원인도 특정하지 못했을 때 사용자에게 보여줄 최종 문구. */
export const DEFAULT_ERROR_MESSAGE = '요청 처리에 실패했습니다.';

/**
 * 잡힌 예외에서 사용자에게 보여줄 문구를 뽑아낸다.
 *
 * `apiClient` 는 응답 에러에 서버 메시지를, 전송 계층 에러(타임아웃·네트워크·인증 만료)에는
 * 코드별 한국어 문구를 이미 채워서 던지므로, 호출부는 기본 문구를 따로 지정하지 않아도 된다.
 * `fallback` 은 `apiClient` 를 거치지 않은 값이 잡힌 경우를 위해서만 남겨 두었다.
 */
export function getErrorMessage(error: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }
  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }
  return fallback;
}
