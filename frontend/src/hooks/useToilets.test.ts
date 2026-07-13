import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToilets } from './useToilets';
import { ToiletProvider } from '../context/ToiletContext';

// ── apiClient 모킹 ──────────────────────────────────────────────
vi.mock('../services/apiClient', () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from '../services/apiClient';
const mockApi = api as { get: ReturnType<typeof vi.fn> };

// ── 테스트 픽스처 ────────────────────────────────────────────────
const makeMockToilet = (id: number) => ({
  id,
  name: `화장실 ${id}`,
  address: `주소 ${id}`,
  latitude: 37.5 + id * 0.001,
  longitude: 126.9 + id * 0.001,
  openHours: '00:00~24:00',
  is24h: true,
  isMixedGender: false,
  hasDiaperTable: false,
  hasEmergencyBell: false,
  hasCCTV: false,
});

/**
 * fake timers + async promise 처리 헬퍼
 * - vi.runAllTimersAsync(): 타이머를 실행하면서 발생하는 모든 Promise까지 flush
 * - act() 래핑: React state 업데이트 동기화
 */
async function flush() {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

describe('useToilets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockApi.get.mockResolvedValue([makeMockToilet(1), makeMockToilet(2)]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────────────────────
  // [P7] boundsKey 안정성: 동일 좌표 다른 참조 → 재페치 없음
  // ─────────────────────────────────────────────────────────────
  describe('boundsKey 의존성 안정성', () => {
    it('동일한 좌표값의 다른 bounds 객체는 재페치를 유발하지 않아야 한다', async () => {
      const bounds1 = { swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0 };
      const bounds2 = { swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0 }; // 같은 값, 다른 참조

      const { rerender } = renderHook(
        ({ bounds }) => useToilets({ lat: 37.5, lng: 126.9, bounds }),
        { 
          initialProps: { bounds: bounds1 },
          wrapper: ToiletProvider
        }
      );

      await flush(); // 초기 debounce(300ms) + API Promise flush
      expect(mockApi.get).toHaveBeenCalledTimes(1);

      rerender({ bounds: bounds2 });
      await flush();

      // boundsKey 동일 → fetchToilets deps 변경 없음 → 추가 호출 없어야 함
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it('bounds가 null이면 정상적으로 API를 호출하고 에러가 없어야 한다', async () => {
      const { result } = renderHook(() =>
        useToilets({ lat: 37.5, lng: 126.9, bounds: null }),
        { wrapper: ToiletProvider }
      );

      await flush();

      expect(result.current.error).toBeNull();
      expect(result.current.toilets.length).toBeGreaterThan(0);
    });

    it('bounds 좌표가 실제로 변경되면 재페치가 발생해야 한다', async () => {
      const bounds1 = { swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0 };
      const bounds2 = { swLat: 37.3, swLng: 126.7, neLat: 37.7, neLng: 127.1 }; // 다른 좌표

      const { rerender } = renderHook(
        ({ bounds }) => useToilets({ lat: 37.5, lng: 126.9, bounds }),
        { 
          initialProps: { bounds: bounds1 },
          wrapper: ToiletProvider
        }
      );

      await flush();
      expect(mockApi.get).toHaveBeenCalledTimes(1);

      rerender({ bounds: bounds2 });
      await flush();
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // lat/lng 변경 시 재페치
  // ─────────────────────────────────────────────────────────────
  describe('lat/lng 변경 시 재페치', () => {
    it('lat이 변경되면 API를 다시 호출해야 한다', async () => {
      const { rerender } = renderHook(
        ({ lat }) => useToilets({ lat, lng: 126.9 }),
        { 
          initialProps: { lat: 37.5 },
          wrapper: ToiletProvider
        }
      );

      await flush();
      expect(mockApi.get).toHaveBeenCalledTimes(1);

      rerender({ lat: 37.6 });
      await flush();
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 에러 처리
  // ─────────────────────────────────────────────────────────────
  describe('에러 처리', () => {
    it('API 실패 시 error 상태가 설정되어야 한다', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('네트워크 오류'));

      const { result } = renderHook(() =>
        useToilets({ lat: 37.5, lng: 126.9 }),
        { wrapper: ToiletProvider }
      );

      await flush();

      expect(result.current.error).toBe('데이터를 불러오지 못했습니다.');
      expect(result.current.toilets).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 데이터 변환
  // ─────────────────────────────────────────────────────────────
  describe('데이터 변환', () => {
    it('API 응답이 ToiletData 타입으로 정상 변환되어야 한다', async () => {
      const { result } = renderHook(() =>
        useToilets({ lat: 37.5, lng: 126.9 }),
        { wrapper: ToiletProvider }
      );

      await flush();

      expect(result.current.toilets.length).toBeGreaterThan(0);
      const toilet = result.current.toilets[0];
      expect(toilet).toMatchObject({
        id: '1',
        name: '화장실 1',
        roadAddress: '주소 1',
        isOpen24h: true,
        isVisited: false,
        isFavorite: false,
      });
    });

    it('API 응답 1000개 초과 시 1000개로 제한해야 한다', async () => {
      const largeData = Array.from({ length: 1500 }, (_, i) => makeMockToilet(i + 1));
      mockApi.get.mockResolvedValueOnce(largeData);

      const { result } = renderHook(() =>
        useToilets({ lat: 37.5, lng: 126.9 }),
        { wrapper: ToiletProvider }
      );

      await flush();

      expect(result.current.toilets.length).toBeLessThanOrEqual(1000);
    });
  });
});
