import { useState, useEffect, useCallback, useRef } from 'react';
import { ToiletData } from '../types/toilet';
import { api } from '../services/apiClient';

// ── 공공데이터 API 응답 → 내부 타입 변환 ─────────────────────────────
interface RawToiletItem {
  wtnnmNm: string;
  rdnmadr: string;
  lnmadr?: string;
  latitude: string;
  longitude: string;
  opntime?: string;
  clstime?: string;
  satOpntime?: string;
  satClstime?: string;
  holOpntime?: string;
  holClstime?: string;
  wntyIsYn?: string;
  mlChmnCnt?: string;
  mlUrinalCnt?: string;
  fmlChmnCnt?: string;
  dspsChmnCnt?: string;
  chldChmnCnt?: string;
  nprgnDprtrFcltyIsYn?: string;
  emgncyBellIsYn?: string;
  cctvisYn?: string;
  institutionNm?: string;
  phoneNumber?: string;
}

function parseOpenTime(open?: string, close?: string): string | undefined {
  if (!open || !close) return undefined;
  return `${open}~${close}`;
}

function isOpen24h(openTime?: string): boolean {
  if (!openTime) return false;
  return openTime.includes('00:00~24:00') || openTime.includes('00:00~23:59');
}

// ── 훅 ────────────────────────────────────────────────────────────────
interface UseToiletsOptions {
  lat: number;
  lng: number;
  radius?: number;
  bounds?: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  } | null;
  level?: number;
  visitedIds?: Set<string>; // 방문한 화장실 ID Set
  favoriteIds?: Set<string>; // 즐겨찾기한 화장실 ID Set
}

export function useToilets({
  lat,
  lng,
  radius = 1000,
  bounds,
  level,
  visitedIds,
  favoriteIds,
}: UseToiletsOptions) {
  const [toilets, setToilets] = useState<ToiletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  // fetchToilets 클로저 안에서 항상 최신 값을 읽기 위한 ref
  const visitedIdsRef = useRef(visitedIds);
  const favoriteIdsRef = useRef(favoriteIds);
  useEffect(() => {
    visitedIdsRef.current = visitedIds;
  }, [visitedIds]);
  useEffect(() => {
    favoriteIdsRef.current = favoriteIds;
  }, [favoriteIds]);

  const fetchToilets = useCallback(async () => {
    if (!lat || !lng) return;

    try {
      setLoading(true);
      setError(null);

      let fetchRadius = radius;
      let finalLat = lat;
      let finalLng = lng;

      if (bounds) {
        const centerLat = (bounds.swLat + bounds.neLat) / 2;
        const centerLng = (bounds.swLng + bounds.neLng) / 2;
        const R = 6371000;
        const dLat = ((bounds.neLat - centerLat) * Math.PI) / 180;
        const dLng = ((bounds.neLng - centerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((bounds.neLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const dynamicRadius = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        finalLat = centerLat;
        finalLng = centerLng;
        // ★ 성능 최적화: 줌 레벨이 높을수록(축척이 클수록) 반경을 적절히 제한하여 데이터 폭주 방지
        // level 5: ~1km, level 6: ~2km, level 7: ~4km ... 최대 5km로 제한
        const maxRadiusByLevel = level && level >= 7 ? 5000 : 3000;
        fetchRadius = Math.min(dynamicRadius, maxRadiusByLevel);
      }

      const backendData = await api.get(
        `/toilets?latitude=${finalLat}&longitude=${finalLng}&radius=${fetchRadius}`,
      );
      // ★ 성능 최적화: 데이터 개수가 너무 많으면 상위 1000개만 사용
      const rawData = Array.isArray(backendData) ? backendData.slice(0, 1000) : [];

      const data: ToiletData[] = rawData.map((item: any) => ({
        id: String(item.id),
        name: item.name || '이름없음',
        roadAddress: item.address || '',
        lat: item.latitude,
        lng: item.longitude,
        openTime: item.openHours,
        isOpen24h: item.is24h,
        isVisited: visitedIdsRef.current?.has(String(item.id)) ?? false,
        isFavorite: favoriteIdsRef.current?.has(String(item.id)) ?? false,
        isMixedGender: item.isMixedGender || false,
        hasDiaperTable: item.hasDiaperTable || false,
        hasEmergencyBell: item.hasEmergencyBell || false,
        hasCCTV: item.hasCCTV || false,
      }));

      setToilets((prev) => {
        if (prev.length === 0) return data;
        const prevMap = new Map(prev.map((t) => [t.id, t]));

        const merged = data.map((t) => {
          const existing = prevMap.get(t.id);
          if (existing) {
            return { ...t, isFavorite: existing.isFavorite, isVisited: existing.isVisited };
          }
          return t;
        });
        return merged;
      });

      initialLoadDone.current = true;
    } catch (e) {
      console.error('[useToilets] fetch 실패:', e);
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius, JSON.stringify(bounds), level]);

  // ★ 성능 최적화: 디바운스 적용 (300ms 동안Bounds 변화가 없을 때만 호출)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchToilets();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchToilets]);

  // favoriteIds가 비동기로 늦게 오는 경우 기존 목록에 동기화
  useEffect(() => {
    if (!favoriteIds) return;
    setToilets((prev) => prev.map((t) => ({ ...t, isFavorite: favoriteIds.has(t.id) })));
  }, [favoriteIds]);

  // visitedIds가 비동기로 늦게 오는 경우 기존 목록에 동기화 (이미 방문 처리된 건 유지)
  useEffect(() => {
    if (!visitedIds) return;
    setToilets((prev) =>
      prev.map((t) => ({ ...t, isVisited: t.isVisited || visitedIds.has(t.id) })),
    );
  }, [visitedIds]);

  const toggleFavorite = useCallback((id: string) => {
    setToilets((prev) => prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t)));
  }, []);

  const markVisited = useCallback((id: string) => {
    setToilets((prev) => prev.map((t) => (t.id === id ? { ...t, isVisited: true } : t)));
  }, []);

  return { toilets, loading, error, toggleFavorite, markVisited, refetch: fetchToilets };
}
