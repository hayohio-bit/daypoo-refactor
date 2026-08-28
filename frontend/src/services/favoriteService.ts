import { api } from './apiClient';

/** GET /api/v1/favorites — 즐겨찾기한 화장실 id 목록 */
export async function getFavoriteIds(): Promise<number[]> {
  return api.get<number[]>('/favorites');
}

/** POST /api/v1/favorites/{toiletId} — 토글. 등록되면 true, 해제되면 false를 반환한다. */
export async function toggleFavorite(toiletId: string | number): Promise<boolean> {
  return api.post<boolean>(`/favorites/${toiletId}`);
}
