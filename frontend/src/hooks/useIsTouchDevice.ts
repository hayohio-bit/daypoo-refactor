/**
 * 터치 기기 감지 유틸리티.
 * iOS Safari 전 버전에서 안전하게 동작하도록 모든 API 호출을 try-catch로 보호함.
 * React Hook이 아닌 순수 함수이므로 조건부 호출 가능.
 */
let _cachedResult: boolean | null = null;

export function isTouchDevice(): boolean {
  if (_cachedResult !== null) return _cachedResult;
  if (typeof window === 'undefined') return false;

  try {
    _cachedResult =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;
  } catch {
    _cachedResult = false;
  }

  return _cachedResult;
}

/**
 * React 컴포넌트용 래퍼.
 * 내부적으로 캐싱된 결과만 반환하므로 리렌더링 비용 없음.
 */
export function useIsTouchDevice(): boolean {
  return isTouchDevice();
}
