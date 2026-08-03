import { calculateDistance } from './distance';

/**
 * 하버사인 공식(Haversine Formula)을 이용한 두 좌표 간 거리 계산 (미터 단위)
 * @deprecated Use calculateDistance from './distance' directly
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return calculateDistance(lat1, lng1, lat2, lng2);
}
