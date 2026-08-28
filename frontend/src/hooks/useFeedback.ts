import { useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';

const DEFAULT_ERROR_TITLE = '문제가 발생했어요';
const DEFAULT_SUCCESS_TITLE = '완료했어요';
const DEFAULT_INFO_TITLE = '확인해주세요';

/**
 * 화면 공통 피드백 수단. 브라우저 `alert` 대신 알림 토스트로 결과를 전달한다.
 *
 * `alert` 는 렌더링을 멈추고 사용자가 확인을 누를 때까지 다른 조작을 막기 때문에,
 * 실패 원인을 알리는 용도로는 적절하지 않아 토스트로 대체했다.
 */
export function useFeedback() {
  const { showToast } = useToast();

  /**
   * 잡힌 예외를 오류 토스트로 알린다.
   *
   * 표시 문구는 `getErrorMessage` 가 결정한다. `apiClient` 가 서버 메시지와 전송 계층
   * 코드별 문구를 이미 채워 두므로, 호출부가 기본 문구를 넘길 필요는 없다.
   * 예외를 잡지 않고 상황만 알리는 경우에는 `error` 자리에 문구를 직접 넘긴다.
   */
  const notifyError = useCallback(
    (error: unknown, title: string = DEFAULT_ERROR_TITLE) => {
      console.error(`${title}:`, error);
      showToast(title, getErrorMessage(error), 'error');
    },
    [showToast],
  );

  const notifySuccess = useCallback(
    (message: string, title: string = DEFAULT_SUCCESS_TITLE) => {
      showToast(title, message, 'info');
    },
    [showToast],
  );

  const notifyInfo = useCallback(
    (message: string, title: string = DEFAULT_INFO_TITLE) => {
      showToast(title, message, 'info');
    },
    [showToast],
  );

  return { notifyError, notifySuccess, notifyInfo };
}
