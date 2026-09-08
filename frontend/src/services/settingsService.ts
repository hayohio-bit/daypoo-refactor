import type { PublicSettings } from '../types/settings';
import { api } from './apiClient';

/** GET /api/v1/settings/public — 비로그인 상태에서도 호출할 수 있다 */
export async function getPublicSettings(): Promise<PublicSettings> {
  return api.get<PublicSettings>('/settings/public');
}
