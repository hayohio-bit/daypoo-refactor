import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

interface UseAsyncStateOptions<T> {
  /** 최초 마운트 시 자동으로 fetcher를 실행할지 여부 (기본: true) */
  immediate?: boolean;
  /** 에러 발생 시 처리할 콜백 */
  onError?: (error: Error) => void;
  /** 성공적으로 데이터를 가져왔을 때 처리할 콜백 */
  onSuccess?: (data: T) => void;
}

/**
 * API 호출 등 비동기 작업의 loading, error, data 상태를 관리하는 커스텀 훅.
 * stale closure를 방지하기 위해 최신 fetcher를 useRef로 추적합니다.
 *
 * @param fetcher 비동기 데이터를 반환하는 프로미스 함수
 * @param deps fetcher 재생성 및 자동 refetch의 기준이 되는 의존성 배열
 * @param options 세부 설정 옵션
 */
export function useAsyncState<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
  options: UseAsyncStateOptions<T> = {},
) {
  const { immediate = true, onError, onSuccess } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  // 최신 fetcher와 콜백을 ref에 보관하여 stale closure 문제 원천 차단
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      if (onSuccessRef.current) {
        onSuccessRef.current(result);
      }
      return result;
    } catch (err: any) {
      const errMsg = err.message || '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errMsg);
      if (onErrorRef.current) {
        onErrorRef.current(err instanceof Error ? err : new Error(errMsg));
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 의존성(deps) 배열이 변경되면 자동 호출 (immediate가 true인 경우만)
  useEffect(() => {
    if (immediate) {
      execute().catch((err) => {
        console.error('[useAsyncState] Auto-fetch failed:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
}
export default useAsyncState;
