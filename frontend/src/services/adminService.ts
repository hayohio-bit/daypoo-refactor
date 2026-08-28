import type {
  AdminInquiryDetailResponse,
  AdminInquiryListResponse,
  AdminStatsResponse,
  AdminToiletListResponse,
  AdminUserDetailResponse,
  AdminUserListResponse,
  PageResponse,
  Role,
  SyncStatusResponse,
  SystemLog,
} from '../types/admin';
import { api } from './apiClient';

// ── 대시보드 ──────────────────────────────────────────────────────

/** GET /api/v1/admin/stats */
export async function getAdminStats(): Promise<AdminStatsResponse> {
  return api.get<AdminStatsResponse>('/admin/stats');
}

/** GET /api/v1/admin/logs */
export async function getSystemLogs(): Promise<SystemLog[]> {
  return api.get<SystemLog[]>('/admin/logs');
}

// ── 사용자 ────────────────────────────────────────────────────────

/** GET /api/v1/admin/users */
export async function getAdminUsers(
  params: URLSearchParams,
): Promise<PageResponse<AdminUserListResponse>> {
  return api.get<PageResponse<AdminUserListResponse>>(`/admin/users?${params}`);
}

/** GET /api/v1/admin/users/{userId} */
export async function getAdminUserDetail(userId: number): Promise<AdminUserDetailResponse> {
  return api.get<AdminUserDetailResponse>(`/admin/users/${userId}`);
}

/** PATCH /api/v1/admin/users/{userId}/role */
export async function updateAdminUserRole(userId: number, role: Role): Promise<void> {
  await api.patch(`/admin/users/${userId}/role`, { role });
}

/** DELETE /api/v1/admin/users/{userId} */
export async function deleteAdminUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

// ── 문의(CS) ──────────────────────────────────────────────────────

/** GET /api/v1/admin/inquiries */
export async function getAdminInquiries(
  params: URLSearchParams,
): Promise<PageResponse<AdminInquiryListResponse>> {
  return api.get<PageResponse<AdminInquiryListResponse>>(`/admin/inquiries?${params}`);
}

/** GET /api/v1/admin/inquiries/{inquiryId} */
export async function getAdminInquiryDetail(
  inquiryId: number,
): Promise<AdminInquiryDetailResponse> {
  return api.get<AdminInquiryDetailResponse>(`/admin/inquiries/${inquiryId}`);
}

/** POST /api/v1/admin/inquiries/{inquiryId}/answer */
export async function answerAdminInquiry(inquiryId: number, answer: string): Promise<void> {
  await api.post(`/admin/inquiries/${inquiryId}/answer`, { answer });
}

/** POST /api/v1/admin/inquiries/generate-test-data */
export async function generateInquiryTestData(): Promise<void> {
  await api.post('/admin/inquiries/generate-test-data');
}

// ── 화장실 ────────────────────────────────────────────────────────

/** GET /api/v1/admin/toilets */
export async function getAdminToilets(
  query: string,
): Promise<PageResponse<AdminToiletListResponse>> {
  return api.get<PageResponse<AdminToiletListResponse>>(`/admin/toilets?${query}`);
}

/** POST /api/v1/admin/sync-toilets — 공공데이터 동기화 시작 */
export async function startToiletSync(startPage = 1, endPage = 550): Promise<void> {
  await api.post(`/admin/sync-toilets?startPage=${startPage}&endPage=${endPage}`);
}

/** GET /api/v1/admin/sync-toilets/status */
export async function getToiletSyncStatus(): Promise<SyncStatusResponse> {
  return api.get<SyncStatusResponse>('/admin/sync-toilets/status');
}
