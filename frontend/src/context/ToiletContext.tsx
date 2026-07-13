import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToiletData } from '../types/toilet';
import { api } from '../services/apiClient';

interface ToiletContextType {
  toilets: ToiletData[];
  loading: boolean;
  error: string | null;
  fetchToilets: (options: {
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
    visitedIds?: Set<string>;
    favoriteIds?: Set<string>;
  }) => Promise<void>;
  toggleFavorite: (id: string) => void;
  markVisited: (id: string) => void;
}

const ToiletContext = createContext<ToiletContextType | undefined>(undefined);

export function ToiletProvider({ children }: { children: React.ReactNode }) {
  const [toilets, setToilets] = useState<ToiletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이중 API 호출을 방지하기 위한 캐싱 / 중복 요청 억제용 Ref
  const lastRequestKeyRef = useRef<string>('');

  const toggleFavorite = useCallback((id: string) => {
    setToilets((prev) => prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t)));
  }, []);

  const markVisited = useCallback((id: string) => {
    setToilets((prev) => prev.map((t) => (t.id === id ? { ...t, isVisited: true } : t)));
  }, []);

  const fetchToilets = useCallback(async (options: {
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
    visitedIds?: Set<string>;
    favoriteIds?: Set<string>;
  }) => {
    const { lat, lng, radius = 1000, bounds, level, visitedIds, favoriteIds } = options;
    if (!lat || !lng) return;

    const boundsKey = bounds
      ? `${bounds.swLat},${bounds.swLng},${bounds.neLat},${bounds.neLng}`
      : 'null';
    
    // 동일한 파라미터로 이미 API 호출을 처리했다면 재호출하지 않음
    const requestKey = `${lat},${lng},${radius},${boundsKey},${level}`;
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }
    lastRequestKeyRef.current = requestKey;

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
        const maxRadiusByLevel = level && level >= 7 ? 5000 : 3000;
        fetchRadius = Math.min(dynamicRadius, maxRadiusByLevel);
      }

      const backendData = await api.get(
        `/toilets?latitude=${finalLat}&longitude=${finalLng}&radius=${fetchRadius}`,
      );
      const rawData = Array.isArray(backendData) ? backendData.slice(0, 1000) : [];

      const data: ToiletData[] = rawData.map((item: any) => ({
        id: String(item.id),
        name: item.name || '이름없음',
        roadAddress: item.address || '',
        lat: item.latitude,
        lng: item.longitude,
        openTime: item.openHours,
        isOpen24h: item.is24h,
        isVisited: visitedIds?.has(String(item.id)) ?? false,
        isFavorite: favoriteIds?.has(String(item.id)) ?? false,
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
            return {
              ...t,
              isFavorite: favoriteIds?.has(t.id) ?? existing.isFavorite,
              isVisited: visitedIds?.has(t.id) ?? existing.isVisited
            };
          }
          return t;
        });
        return merged;
      });

    } catch (e) {
      console.error('[ToiletContext] fetch 실패:', e);
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ToiletContext.Provider
      value={{ toilets, loading, error, fetchToilets, toggleFavorite, markVisited }}
    >
      {children}
    </ToiletContext.Provider>
  );
}

export function useToiletContext() {
  const context = useContext(ToiletContext);
  if (!context) {
    throw new Error('useToiletContext must be used within a ToiletProvider');
  }
  return context;
}
