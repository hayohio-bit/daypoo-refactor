import type { UserResponse } from '../types/api';
import { api } from './apiClient';

/** 로그인·회원가입 응답 (백엔드가 액세스·리프레시 토큰을 함께 내려준다) */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/** POST /api/v1/auth/login */
export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  return api.post<AuthTokenResponse>('/auth/login', { email, password });
}

/** POST /api/v1/auth/signup — 가입 즉시 토큰을 반환하므로 별도 로그인 호출이 필요 없다. */
export async function signup(
  email: string,
  password: string,
  nickname: string,
): Promise<AuthTokenResponse> {
  return api.post<AuthTokenResponse>('/auth/signup', { email, password, nickname });
}

/** POST /api/v1/auth/social/signup */
export async function socialSignup(
  registrationToken: string,
  nickname: string,
): Promise<AuthTokenResponse> {
  return api.post<AuthTokenResponse>('/auth/social/signup', { registrationToken, nickname });
}

/** POST /api/v1/auth/logout */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/** GET /api/v1/auth/me */
export async function getMe(): Promise<UserResponse> {
  return api.get<UserResponse>('/auth/me');
}

/** DELETE /api/v1/auth/me — 회원 탈퇴 */
export async function deleteMe(): Promise<void> {
  await api.delete('/auth/me');
}

/** GET /api/v1/auth/check-email — 중복이면 에러를 던진다. */
export async function checkEmailAvailable(email: string): Promise<void> {
  await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
}

/** GET /api/v1/auth/check-nickname — 중복이면 에러를 던진다. */
export async function checkNicknameAvailable(nickname: string): Promise<void> {
  await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
}

/** GET /api/v1/auth/find-id — 닉네임으로 가입 이메일을 찾는다. */
export async function findEmailByNickname(nickname: string): Promise<unknown> {
  return api.get(`/auth/find-id?nickname=${encodeURIComponent(nickname)}`);
}

/** POST /api/v1/auth/password/reset — 비밀번호 재설정 메일 발송 */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post(`/auth/password/reset?email=${encodeURIComponent(email)}`, null);
}

/** PATCH /api/v1/auth/profile */
export async function updateNickname(nickname: string): Promise<void> {
  await api.patch('/auth/profile', { nickname });
}

/** PATCH /api/v1/auth/password */
export async function updatePassword(password: string): Promise<void> {
  await api.patch('/auth/password', { password });
}
