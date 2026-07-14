import { useCallback, useEffect, useRef } from 'react';
import { useToiletContext } from '../context/ToiletContext';

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
  visitedIds?: Set<string>;
  favoriteIds?: Set<string>;
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
  const { toilets, loading, error, fetchToilets, toggleFavorite, markVisited } = useToiletContext();

  const visitedIdsRef = useRef(visitedIds);
  const favoriteIdsRef = useRef(favoriteIds);

  useEffect(() => {
    visitedIdsRef.current = visitedIds;
  }, [visitedIds]);

  useEffect(() => {
    favoriteIdsRef.current = favoriteIds;
  }, [favoriteIds]);

  // boundsKey: JSON.stringify 대신 안정적 문자열로 변환 (ESLint 훅 rules 준수)
  const boundsKey = bounds
    ? `${bounds.swLat},${bounds.swLng},${bounds.neLat},${bounds.neLng}`
    : 'null';

  const triggerFetch = useCallback(() => {
    fetchToilets({
      lat,
      lng,
      radius,
      bounds,
      level,
      visitedIds: visitedIdsRef.current,
      favoriteIds: favoriteIdsRef.current,
    });
  }, [lat, lng, radius, boundsKey, level, fetchToilets]);

  // 디바운스 적용 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerFetch();
    }, 300);
    return () => clearTimeout(timer);
  }, [triggerFetch]);

  // favoriteIds 또는 visitedIds가 나중에 비동기로 로드되어 변경되는 경우 재호출
  useEffect(() => {
    if (favoriteIds || visitedIds) {
      triggerFetch();
    }
  }, [favoriteIds, visitedIds, triggerFetch]);

  return { toilets, loading, error, toggleFavorite, markVisited, refetch: triggerFetch };
}
