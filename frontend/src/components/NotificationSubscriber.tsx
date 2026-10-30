import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { getAccessToken } from '../services/apiClient';
import { issueSseToken } from '../services/notificationService';

const MAX_RETRY_COUNT = 10; // F4: 최대 재시도 횟수
const BASE_RETRY_DELAY = 1000; // F4: 기본 재시도 지연 (1초)
const MAX_RETRY_DELAY = 30000; // F4: 최대 재시도 지연 (30초)

export const NotificationSubscriber: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { fetchNotifications } = useNotification();
  const { showToast } = useToast();
  // 재시도 횟수는 ref 로 들고, 재연결은 tick 상태로만 유발한다.
  // 횟수를 state 로 두고 connectSSE 가 그 값을 읽으면 useCallback 클로저가 낡은 값을 보거나,
  // 성공 시 0 으로 되돌릴 때 effect 가 다시 실행되어 방금 연 연결을 끊고 다시 연결한다.
  const retryCountRef = useRef(0);
  const [reconnectTick, setReconnectTick] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectSSE = useCallback(async () => {
    // SSE 기능 활성화
    const SSE_ENABLED = true;
    if (!SSE_ENABLED) return;

    const accessToken = getAccessToken();
    if (!accessToken || !user) return;

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || '';

      // SSE 전용 단기 토큰 발급 (POST /notifications/sse-token)
      let subToken = accessToken;
      try {
        const res = await issueSseToken();
        if (res && res.sseToken) subToken = res.sseToken;
      } catch (err) {
        // 발급에 실패하면 기존 액세스 토큰으로 구독을 시도한다
        console.warn('SSE 전용 토큰 발급 실패, 기존 토큰 사용:', err);
      }

      const eventSource = new EventSource(
        `${BASE_URL}/api/v1/notifications/subscribe?token=${subToken}`,
      );
      eventSourceRef.current = eventSource;

      // F4: 연결 성공 시 재시도 카운트 리셋
      eventSource.onopen = () => {
        console.log('SSE 연결 성공');
        retryCountRef.current = 0;
      };

      eventSource.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) {
            showToast(
              data.title || '새로운 알림',
              data.message,
              data.type?.toLowerCase() || 'info',
              data.icon,
            );
            fetchNotifications();
            refreshUser();
          }
        } catch (err) {
          console.error('알림 파싱 실패:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.error('SSE 연결 에러 (재연결 시도 중):', err);
        eventSource.close();

        // F4: 최대 재시도 횟수 체크
        const retryCount = retryCountRef.current;
        if (retryCount >= MAX_RETRY_COUNT) {
          console.error('SSE 최대 재시도 횟수 초과');
          showToast(
            '알림 연결 실패',
            '알림 서비스에 연결할 수 없습니다. 나중에 다시 시도해주세요.',
            'info',
          );
          return;
        }

        // F4: 지수 백오프 (1초 → 2초 → 4초 → 8초 → ... 최대 30초)
        const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
        console.log(`SSE 재연결 시도 ${retryCount + 1}/${MAX_RETRY_COUNT} (${delay}ms 후)`);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          setReconnectTick((tick) => tick + 1);
        }, delay);
      };
    } catch (err) {
      console.error('SSE 연결 실패:', err);
    }
  }, [user, refreshUser, showToast, fetchNotifications]);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [connectSSE, reconnectTick]);

  return null;
};
