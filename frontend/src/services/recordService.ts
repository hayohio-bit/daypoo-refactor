import type { CreateRecordRequest } from '../types/api';
import { api } from './apiClient';

/** POST /api/v1/records/check-in — 방문 시작 시각을 서버에 기록한다. */
export async function checkIn(toiletId: number, latitude: number, longitude: number): Promise<any> {
  return api.post('/records/check-in', { toiletId, latitude, longitude });
}

/** POST /api/v1/records — 방문 인증과 배변 기록 생성 */
export async function createRecord(payload: CreateRecordRequest): Promise<void> {
  await api.post('/records', payload);
}

/** GET /api/v1/records/me — 내 기록 목록 */
export async function getMyRecords(): Promise<any[]> {
  return api.get<any[]>('/records/me');
}

/** GET /api/v1/records/my-visit-counts — 화장실 id별 방문 횟수 */
export async function getMyVisitCounts(): Promise<Record<string, number>> {
  return api.get<Record<string, number>>('/records/my-visit-counts');
}
