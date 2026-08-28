import type React from 'react';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  deleteNotification as deleteNotificationRequest,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';
import { useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';

export interface Notification {
  id: number;
  type: 'INFO' | 'ACHIEVEMENT' | 'INQUIRY_REPLY' | 'SYSTEM';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * 알림 목록 상태를 제공하고, 그 아래에 토스트 프로바이더를 둔다.
 *
 * 토스트는 `ToastContext` 가 따로 관리한다. 토스트가 뜨고 사라지는 것과 알림 목록이 바뀌는 것은
 * 서로 다른 사건인데 한 컨텍스트에 있으면 한쪽 변화가 다른 쪽 구독자까지 다시 렌더링시킨다.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const auth = useAuth();

  // 로그아웃 시 알림 상태 초기화
  useEffect(() => {
    if (!auth.user) {
      setNotifications([]);
    }
  }, [auth.user]);

  const unreadCount = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0),
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('알림 목록 가져오기 실패:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => ({ ...n, isRead: true })) : [],
      );
    } catch (err) {
      console.error('알림 전체 읽음 처리 실패:', err);
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => ({ ...n, isRead: true })) : [],
      );
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : [],
      );
    } catch (err) {
      console.error('알림 개별 읽음 처리 실패:', err);
      // 실패 시에도 사용자 경험을 위해 로컬 상태만이라도 업데이트
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : [],
      );
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await deleteNotificationRequest(id);
      setNotifications((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== id) : []));
    } catch (err) {
      console.error('알림 삭제 실패:', err);
      setNotifications((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== id) : []));
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      fetchNotifications,
      markAllAsRead,
      markAsRead,
      deleteNotification,
      setNotifications,
    }),
    [notifications, unreadCount, fetchNotifications, markAllAsRead, markAsRead, deleteNotification],
  );

  return (
    <NotificationContext.Provider value={value}>
      <ToastProvider>{children}</ToastProvider>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
