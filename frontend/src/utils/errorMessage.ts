/**
 * 잡힌 예외에서 사용자에게 보여줄 문구를 뽑아낸다.
 *
 * `apiClient` 가 던지는 `ApiError` 는 백엔드 응답의 메시지를 그대로 담고 있으므로 우선 사용하고,
 * 메시지가 없거나 Error 가 아닌 값이 잡힌 경우에는 호출부가 지정한 기본 문구로 대체한다.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }
  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }
  return fallback;
}
