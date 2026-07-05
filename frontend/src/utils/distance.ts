/**
 * 두 지점 간의 거리를 계산합니다 (Haversine formula)
 * @param lat1 첫 번째 지점의 위도
 * @param lng1 첫 번째 지점의 경도
 * @param lat2 두 번째 지점의 위도
 * @param lng2 두 번째 지점의 경도
 * @returns 거리 (미터 단위)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // 지구 반경 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 거리 (미터)
}

/**
 * 거리가 지정된 범위 내에 있는지 확인합니다
 * @param distance 거리 (미터)
 * @param maxDistance 최대 거리 (미터)
 * @returns 범위 내에 있으면 true
 */
export function isWithinRange(distance: number, maxDistance: number): boolean {
  return distance <= maxDistance;
}
