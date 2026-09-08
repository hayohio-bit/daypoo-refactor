import { useCallback, useEffect, useState } from 'react';
import { getPublicSettings } from '../services/settingsService';

/** 사용자가 닫은 공지 문구를 담아 두는 키. 문구가 바뀌면 다시 노출해야 하므로 값으로 문구 자체를 저장한다. */
const DISMISSED_KEY = 'notice_dismissed_message';

function readDismissedMessage(): string | null {
  try {
    return localStorage.getItem(DISMISSED_KEY);
  } catch {
    // 사파리 프라이빗 모드 등 localStorage 접근이 막힌 환경에서는 닫음 상태를 기억하지 않는다.
    return null;
  }
}

/**
 * 공개 설정에서 공지 문구를 읽어 배너에 노출할 값을 돌려준다.
 *
 * 공지는 부가 기능이므로 조회에 실패해도 화면에 오류를 알리지 않고 배너만 감춘다.
 */
export function useNotice() {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPublicSettings()
      .then((settings) => {
        if (cancelled) return;
        const next = settings.noticeEnabled ? settings.noticeMessage?.trim() : null;
        setNotice(next && next !== readDismissedMessage() ? next : null);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('공지 설정을 불러오지 못했습니다.', error);
        setNotice(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 상태 업데이터는 순수해야 하므로(StrictMode 에서 두 번 호출된다) 저장은 바깥에서 한다.
  const dismiss = useCallback(() => {
    if (!notice) return;
    try {
      localStorage.setItem(DISMISSED_KEY, notice);
    } catch {
      // 저장에 실패해도 이번 세션 동안은 닫힌 상태를 유지한다.
    }
    setNotice(null);
  }, [notice]);

  /** `notice` 는 노출할 공지 문구다. 공지가 없거나 사용자가 이미 닫았으면 null 이다. */
  return { notice, dismiss };
}
