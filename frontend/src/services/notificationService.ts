import { api } from './apiClient';

/** POST /api/v1/notifications/sse-token — SSE 구독 전용 단기 토큰 */
export async function issueSseToken(): Promise<{ sseToken?: string }> {
  return api.post<{ sseToken?: string }>('/notifications/sse-token', {});
}

/** GET /api/v1/notifications */
export async function getNotifications(): Promise<unknown> {
  return api.get('/notifications');
}

/** POST /api/v1/notifications/mark-all-read */
export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/mark-all-read', {});
}

/** PATCH /api/v1/notifications/{id}/read */
export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`, {});
}

/** DELETE /api/v1/notifications/{id} */
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
