import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

// 첫 로드에서 사용자 정보를 못 읽어 왔을 때(네트워크 오류·5xx) 다시 시도하는 횟수와 간격(시도 횟수만큼 늘어남).
const MAX_USER_LOAD_RETRIES = 3;
const USER_LOAD_RETRY_DELAY_MS = 3000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // 첫 로드가 끝난 뒤의 새로고침(알림 수신, 자동 체크인, 기록 생성 등)은 화면을 로딩 상태로 되돌리지 않는다.
  // 되돌리면 AdminRoute 가 로딩 화면으로 바뀌며 관리자 페이지가 언마운트되어 입력 중이던 내용이 사라진다.
  // 로그아웃하면 다시 false 로 돌려, 다음 로그인의 첫 로드가 로딩 상태를 거치게 한다.
  const initialLoadDone = useRef(false);
  // 겹친 호출 중 가장 마지막 호출의 결과만 반영한다. 로그아웃도 번호를 올려 진행 중이던 응답을 무효로 만든다.
  const refreshSeq = useRef(0);
  const userRef = useRef<UserResponse | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshUserRef = useRef<() => Promise<boolean>>(async () => false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  /** 사용자 정보를 읽어 왔으면 true. 인증 만료·일시 오류로 읽지 못했으면 false. */
  const loadUser = useCallback(async (): Promise<boolean> => {
    const seq = ++refreshSeq.current;
    if (!initialLoadDone.current) setLoading(true);
    const token = getAccessToken();

    if (!token) {
      setUser(null);
      userRef.current = null;
      initialLoadDone.current = true;
      setLoading(false);
      return false;
    }

    try {
      const userData = await getMe();
      if (seq !== refreshSeq.current) return false;
      setUser(userData);
      userRef.current = userData;
      retryCount.current = 0;
      return true;
    } catch (err: any) {
      if (seq !== refreshSeq.current) return false;
      console.error('[AuthContext] Failed to fetch user info');
      // 인증이 만료된 경우(401)만 로그아웃 처리한다. apiClient 가 이미 토큰을 정리하지만 상태를 맞춘다.
      // 네트워크 오류·타임아웃·5xx 같은 일시적 실패에는 토큰과 이미 읽어 온 사용자 정보를 유지한다.
      if (err?.status === 401 || err?.code === 'AUTHENTICATION_REQUIRED') {
        removeTokens();
        setUser(null);
        userRef.current = null;
        return false;
      }
      // 아직 사용자 정보가 없으면(첫 로드 실패) 토큰은 있는데 비로그인처럼 보이는 상태가 되므로 몇 번 다시 시도한다.
      if (!userRef.current && retryCount.current < MAX_USER_LOAD_RETRIES) {
        retryCount.current += 1;
        clearRetryTimer();
        retryTimer.current = setTimeout(() => {
          void refreshUserRef.current();
        }, USER_LOAD_RETRY_DELAY_MS * retryCount.current);
      }
      return userRef.current !== null;
    } finally {
      if (seq === refreshSeq.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    }
  }, [clearRetryTimer]);
  refreshUserRef.current = loadUser;

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  useEffect(() => {
    void loadUser();
    return clearRetryTimer;
  }, [loadUser, clearRetryTimer]);

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
      // 토큰은 저장했지만 사용자 정보를 읽지 못했으면(인증 만료, 일시 오류) 성공으로 끝내지 않는다.
      // 호출자가 성공으로 알고 이동하면 로그인된 것처럼 이동했다가 비로그인 화면을 보게 된다.
      if (!(await loadUser())) {
        throw new Error('사용자 정보를 불러오지 못했습니다.');
      }
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    try {
      // 서버 로그아웃 API 호출 (토큰 블랙리스트 처리 등)
      await logoutRequest().catch((err) => {
        console.warn('Backend logout failed:', err);
      });
    } finally {
      refreshSeq.current += 1; // 진행 중이던 사용자 정보 응답이 로그아웃 뒤 상태를 덮어쓰지 못하게 한다
      clearRetryTimer();
      retryCount.current = 0;
      initialLoadDone.current = false;
      userRef.current = null;
      removeTokens();
      setUser(null);
      setLoading(false);
    }
  }, [clearRetryTimer]);

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
