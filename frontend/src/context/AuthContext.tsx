import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STAY_LOGGED_IN_DURATION_MS, getAccessToken, removeTokens } from '../services/apiClient';
import {
  deleteMe as deleteMeRequest,
  getMe,
  logout as logoutRequest,
} from '../services/authService';
import type { UserResponse } from '../types/api';

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

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const token = getAccessToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await getMe();
      setUser(userData);
    } catch (err: any) {
      console.error('[AuthContext] Failed to fetch user info');
      removeTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    // SSE 로직은 별도 Subscriber 컴포넌트로 이동함
  }, []);

  const login = useCallback(
    async (accessToken: string, refreshToken: string, stayLoggedIn = false) => {
      // 기존 토큰 정리
      removeTokens();
      if (stayLoggedIn) {
        // 로그인 유지: localStorage에 저장 + 만료 시간 설정
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tokenExpiresAt', String(Date.now() + STAY_LOGGED_IN_DURATION_MS));
      } else {
        // 로그인 유지 안 함: sessionStorage (브라우저 닫으면 삭제)
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
      }
      await refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      // 서버 로그아웃 API 호출 (토큰 블랙리스트 처리 등)
      await logoutRequest().catch((err) => {
        console.warn('Backend logout failed:', err);
      });
    } finally {
      removeTokens();
      setUser(null);
    }
  }, []);

  const deleteMe = useCallback(async () => {
    try {
      await deleteMeRequest();
      await logout();
    } catch (err: any) {
      console.error('Failed to delete account', err);
      throw err;
    }
  }, [logout]);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      deleteMe,
      refreshUser,
      isAuthenticated: !!user,
    }),
    [user, loading, login, logout, deleteMe, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
