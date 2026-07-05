import { api } from './apiClient';

// ── 백엔드 DTO 타입 ──────────────────────────────────────────────
export interface ToiletReviewCreateRequest {
  rating: number; // 1-5
  emojiTags: string[]; // ['clean', 'tissue']
  comment: string;
}

export interface ToiletReviewResponse {
  id: number;
  userName: string;
  rating: number;
  emojiTags: string[];
  comment: string;
  helpfulCount: number;
  createdAt: string; // ISO datetime
}

export interface ToiletReviewSummaryResponse {
  aiSummary: string | null;
  avgRating: number;
  reviewCount: number;
  recentReviews: ToiletReviewResponse[];
}

export interface ToiletReviewPageResponse {
  contents: ToiletReviewResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

// ── API 함수 ──────────────────────────────────────────────────────

/**
 * 리뷰 작성
 * POST /api/v1/toilets/{toiletId}/reviews
 */
export async function createReview(
  toiletId: number,
  data: ToiletReviewCreateRequest
): Promise<ToiletReviewResponse> {
  return api.post<ToiletReviewResponse>(`/toilets/${toiletId}/reviews`, data);
}

/**
 * 최근 리뷰 5개 조회
 * GET /api/v1/toilets/{toiletId}/reviews/recent
 */
export async function getRecentReviews(
  toiletId: number
): Promise<ToiletReviewResponse[]> {
  return api.get<ToiletReviewResponse[]>(`/toilets/${toiletId}/reviews/recent`);
}

/**
 * 전체 리뷰 페이징 조회
 * GET /api/v1/toilets/{toiletId}/reviews?page=0&size=10&sort=latest
 */
export async function getReviews(
  toiletId: number,
  page: number = 0,
  size: number = 10,
  sort: 'latest' | 'oldest' = 'latest'
): Promise<ToiletReviewPageResponse> {
  return api.get<ToiletReviewPageResponse>(
    `/toilets/${toiletId}/reviews?page=${page}&size=${size}&sort=${sort}`
  );
}

/**
 * 리뷰 요약 정보 조회 (AI 요약 + 평균별점 + 최근리뷰)
 * GET /api/v1/toilets/{toiletId}/reviews/summary
 */
export async function getReviewSummary(
  toiletId: number
): Promise<ToiletReviewSummaryResponse> {
  return api.get<ToiletReviewSummaryResponse>(`/toilets/${toiletId}/reviews/summary`);
}
