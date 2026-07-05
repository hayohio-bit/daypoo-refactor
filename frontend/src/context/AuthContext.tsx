import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
import { UserResponse } from '../types/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, stayLoggedIn?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  deleteMe: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const isTokenExpiredByTime = useCallback(() => {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (!expiresAt) return false; // 만료 시간 없으면 (로그인 유지 미사용) 세션 기반
    return Date.now() > Number(expiresAt);
  }, []);

  const getToken = useCallback((key: string) => {
    // 로그인 유지 만료 체크
    if (isTokenExpiredByTime()) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiresAt');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      return null;
    }
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }, [isTokenExpiredByTime]);

  const removeTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const token = getToken('accessToken');

    console.log('[AuthContext] refreshUser called. Has token:', !!token);

    if (!token) {
      console.log('[AuthContext] No token found. Setting user to null.');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      console.log('[AuthContext] Fetching user info from /auth/me...');
      const userData = await api.get<any>('/auth/me');
      console.log('[AuthContext] ✅ User data received:', {
        email: userData.email,
        nickname: userData.nickname,
        role: userData.role
      });
      setUser(userData as UserResponse);
    } catch (err: any) {
      console.error('[AuthContext] ❌ Failed to fetch user:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      // 토큰이 유효하지 않으면 로그아웃 처리
      removeTokens();
      setUser(null);
    } finally {
      setLoading(false);
      console.log('[AuthContext] Loading complete. User:', !!user);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    // SSE 로직은 별도 Subscriber 컴포넌트로 이동함
  }, []);

  const login = useCallback(async (accessToken: string, refreshToken: string, stayLoggedIn = false) => {
    // 기존 토큰 정리
    removeTokens();
    if (stayLoggedIn) {
      // 로그인 유지: localStorage에 저장 + 3일 만료 시간 설정
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('tokenExpiresAt', String(Date.now() + THREE_DAYS_MS));
    } else {
      // 로그인 유지 안 함: sessionStorage (브라우저 닫으면 삭제)
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);
    }
    await refreshUser();
  }, [removeTokens, refreshUser]);

  const logout = useCallback(async () => {
    try {
      // 서버 로그아웃 API 호출 (토큰 블랙리스트 처리 등)
      await api.post('/auth/logout').catch(err => {
        console.warn('Backend logout failed or not implemented:', err);
      });
    } finally {
      removeTokens();
      setUser(null);
    }
  }, [removeTokens]);

  const deleteMe = useCallback(async () => {
    try {
      await api.delete('/auth/me');
      await logout();
    } catch (err: any) {
      console.error('Failed to delete account', err);
      throw err;
    }
  }, [logout]);

  const value = React.useMemo(() => ({
    user,
    loading,
    login,
    logout,
    deleteMe,
    refreshUser,
    isAuthenticated: !!user,
  }), [user, loading, login, logout, deleteMe, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
