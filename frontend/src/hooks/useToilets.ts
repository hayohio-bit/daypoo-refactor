import { useCallback, useEffect } from 'react';
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
      visitedIds,
      favoriteIds,
    });
  }, [lat, lng, radius, boundsKey, level, visitedIds, favoriteIds, fetchToilets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerFetch();
    }, 300);
    return () => clearTimeout(timer);
  }, [triggerFetch]);

  return { toilets, loading, error, toggleFavorite, markVisited, refetch: triggerFetch };
}
