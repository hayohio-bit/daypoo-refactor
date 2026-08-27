// 관리자 페이지 관련 타입 정의

export type Role = 'ROLE_USER' | 'ROLE_ADMIN';
export type InquiryStatus = 'PENDING' | 'COMPLETED';

// ========== User Management ==========
export interface AdminUserListResponse {
  id: number;
  email: string;
  nickname: string;
  role: Role;
  plan: 'BASIC' | 'PRO' | 'PREMIUM';
  level: number;
  points: number;
  recordCount: number;
  createdAt: string;
}

export interface AdminUserDetailResponse {
  id: number;
  email: string;
  nickname: string;
  role: Role;
  plan: 'BASIC' | 'PRO' | 'PREMIUM';
  level: number;
  exp: number;
  points: number;
  recordCount: number;
  paymentCount: number;
  totalPaymentAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ========== Toilet Management ==========
export interface AdminToiletListResponse {
  id: number;
  name: string;
  mngNo: string;
  address: string;
  openHours: string;
  is24h: boolean;
  isUnisex: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface AdminToiletUpdateRequest {
  name?: string;
  address?: string;
  openHours?: string;
  is24h?: boolean;
}

// ========== Inquiry (CS) Management ==========
export interface AdminInquiryListResponse {
  id: number;
  userName: string;
  userEmail: string;
  type: string;
  title: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface AdminInquiryDetailResponse extends AdminInquiryListResponse {
  content: string;
  answer: string | null;
  updatedAt: string;
}

export interface AdminInquiryAnswerRequest {
  answer: string;
}

// ========== Dashboard Stats ==========
export interface DailyStat {
  date: string;
  users: number;
  inquiries: number;
  sales: number;
  visits?: number;
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalToilets: number;
  pendingInquiries: number;
  todayNewUsers: number;
  todayInquiries: number;
  weeklyTrend: DailyStat[];
  userDistribution?: { pro: number; basic: number; free: number };
}

// ========== System/Sync Management ==========
export interface SyncStatusResponse {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalCount: number | null;
  insertedCount: number | null;
  updatedCount: number | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}
