import { useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
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
  const { showToast } = useNotification();

  const notifyError = useCallback(
    (error: unknown, fallback: string, title: string = DEFAULT_ERROR_TITLE) => {
      console.error(`${title}:`, error);
      showToast(title, getErrorMessage(error, fallback), 'error');
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
