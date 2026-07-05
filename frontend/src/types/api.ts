import { SubscriptionResponse } from './subscription';

/**
 * API 공통 응답 구조
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: string;
  status?: number;
}

/**
 * 로그인/회원가입 응답
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * 사용자 정보 응답
 */
export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  role: string;
  level: number;
  exp: number;
  points: number;
  equippedTitleId?: number | null;
  equippedTitleName?: string | null;
  isPro?: boolean;
  subscription?: SubscriptionResponse | null;
  birthDate?: string | null;
  homeRegion?: string | null;
  createdAt?: string;
  totalAuthCount?: number;
  totalVisitCount?: number;
  consecutiveDays?: number;
  equippedAvatarUrl?: string | null;
}

/**
 * 화장실 정보
 */
export interface ToiletData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  roadAddress?: string;
  isFavorite?: boolean;
  isVisited?: boolean;
  isOpen24h?: boolean;
  rating?: number;
}

/**
 * 화장실 검색 결과
 */
export interface ToiletSearchResponse {
  toilets: ToiletData[];
  totalCount: number;
}

/**
 * 배변 기록 응답
 */
export interface PooRecordResponse {
  id: number;
  toiletId: number;
  bristolScale: number;
  color: string;
  conditionTags: string[];
  dietTags: string[];
  createdAt: string;
  pointsAwarded?: number;
}

/**
 * AI 분석 응답
 */
export interface AiAnalysisResponse {
  bristolScale: number;
  color: string;
}

/**
 * 체크인 상태 응답
 */
export interface CheckInResponse {
  remainedSeconds: number;
  status: string;
}

/**
 * 방문인증 생성 요청 (위치 인증 전용)
 */
export interface VisitRecordRequest {
  toiletId: number;
  latitude: number;
  longitude: number;
}

/**
 * 배변 패턴 기록 생성 요청 (배변 데이터 전용)
 * imageBase64: 전송 후 서버에서 즉시 폐기 (In-memory pipeline, DB 미저장)
 */
export interface HealthRecordRequest {
  toiletId?: number;
  bristolScale?: number; // 미입력 시 AI 자동 분석
  color?: string;
  conditionTags: string[];
  dietTags: string[];
  imageBase64?: string;
}

/**
 * 방문인증 + 배변 패턴 기록 통합 생성 요청 (POST /records)
 * 현재 백엔드 단일 엔드포인트 대응용 — 추후 엔드포인트 분리 시 제거 예정
 */
export type CreateRecordRequest = VisitRecordRequest & HealthRecordRequest;

/**
 * 알림 정보
 */
export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  icon?: string;
}
