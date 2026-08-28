import { AnimatePresence } from 'framer-motion';
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { NotificationToast, type ToastType } from '../components/NotificationToast';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  icon?: string;
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: ToastType, icon?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/** 토스트가 화면에 머무는 시간 */
const TOAST_DURATION_MS = 5000;

/**
 * 토스트 표시 수단만 제공하는 프로바이더.
 *
 * 토스트 목록은 이 컴포넌트 안에만 두고 컨텍스트로는 `showToast` 하나만 내보낸다.
 * 알림 목록 컨텍스트와 합쳐 두면 토스트가 뜨고 사라질 때마다 컨텍스트 값이 새로 만들어져
 * `useFeedback` 을 쓰는 컴포넌트가 전부 다시 렌더링되기 때문에 분리했다.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (title: string, message: string, type: ToastType = 'info', icon?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, icon }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION_MS);
    },
    [],
  );

  // showToast 가 항상 같은 함수이므로 이 값도 한 번 만들어진 뒤 바뀌지 않는다.
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
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
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
