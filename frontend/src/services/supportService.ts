import { api } from './apiClient';

/**
 * GET /api/v1/support/faqs — 비로그인도 조회할 수 있는 공개 FAQ.
 * 화면마다 필요한 항목 형태가 달라 호출부가 타입을 지정한다.
 */
export async function getFaqs<T>(): Promise<T[]> {
  return api.get<T[]>('/support/faqs');
}

/** 1:1 문의 등록·수정 본문 */
export interface InquiryFormData {
  category: string;
  title: string;
  content: string;
}

/** GET /api/v1/support/inquiries — 내 문의 목록 */
export async function getMyInquiries(): Promise<unknown> {
  return api.get('/support/inquiries');
}

/** POST /api/v1/support/inquiries */
export async function createInquiry(data: InquiryFormData): Promise<void> {
  await api.post('/support/inquiries', data);
}

/** PUT /api/v1/support/inquiries/{id} */
export async function updateInquiry(id: string | number, data: InquiryFormData): Promise<void> {
  await api.put(`/support/inquiries/${id}`, data);
}

/** DELETE /api/v1/support/inquiries/{id} */
export async function deleteInquiry(id: string | number): Promise<void> {
  await api.delete(`/support/inquiries/${id}`);
}
