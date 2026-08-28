import { api } from './apiClient';

/** GET /api/v1/reports/{type} — type은 WEEKLY·MONTHLY 등 백엔드 enum 이름이다. */
export async function getReport(type: string): Promise<any> {
  return api.get(`/reports/${type.toUpperCase()}`);
}
