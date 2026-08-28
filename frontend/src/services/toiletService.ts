import { api } from './apiClient';

/** 백엔드 화장실 응답 원형. 화면용 `ToiletData` 매핑은 호출부가 담당한다. */
export type ToiletApiItem = Record<string, any>;

/** GET /api/v1/toilets — 좌표 기준 반경 검색 */
export async function getToiletsNearby(
  latitude: number,
  longitude: number,
  radius: number,
): Promise<ToiletApiItem[]> {
  return api.get<ToiletApiItem[]>(
    `/toilets?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
  );
}

/** GET /api/v1/toilets/search — 텍스트 검색. 좌표를 주면 거리순 보정에 쓰인다. */
export async function searchToilets(
  query: string,
  size = 20,
  position?: { lat: number; lng: number } | null,
): Promise<ToiletApiItem[]> {
  const locationParams = position ? `&latitude=${position.lat}&longitude=${position.lng}` : '';
  return api.get<ToiletApiItem[]>(
    `/toilets/search?q=${encodeURIComponent(query)}&size=${size}${locationParams}`,
  );
}
