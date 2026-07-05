import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotificationToast, ToastType } from '../components/NotificationToast';
import { api } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  icon?: string;
}

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
  showToast: (title: string, message: string, type?: ToastType, icon?: string) => void;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const auth = useAuth();

  // 로그아웃 시 알림 상태 초기화
  useEffect(() => {
    if (!auth.user) {
      setNotifications([]);
    }
  }, [auth.user]);

  const unreadCount = useMemo(() =>
    Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0
  , [notifications]);

  const showToast = useCallback((title: string, message: string, type: ToastType = 'info', icon?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, icon }]);
    
    // 5초 후에 자동 삭제
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('알림 목록 가져오기 실패:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read', {});
      setNotifications(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, isRead: true })) : []);
    } catch (err) {
      console.error('알림 전체 읽음 처리 실패:', err);
      setNotifications(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, isRead: true })) : []);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(prev => Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, isRead: true } : n) : []);
    } catch (err) {
      console.error('알림 개별 읽음 처리 실패:', err);
      // 실패 시에도 사용자 경험을 위해 로컬 상태만이라도 업데이트
      setNotifications(prev => Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, isRead: true } : n) : []);
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => Array.isArray(prev) ? prev.filter(n => n.id !== id) : []);
    } catch (err) {
      console.error('알림 삭제 실패:', err);
      setNotifications(prev => Array.isArray(prev) ? prev.filter(n => n.id !== id) : []);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      showToast, 
      fetchNotifications, 
      markAllAsRead, 
      markAsRead,
      deleteNotification,
      setNotifications 
    }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[3000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <NotificationToast
              key={toast.id}
              {...toast}
              onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            />
          ))}
        </AnimatePresence>
      </div>
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
