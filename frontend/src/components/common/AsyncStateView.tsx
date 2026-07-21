import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { DependencyList, ReactNode } from 'react';

// ── 타입 ──────────────────────────────────────────────────────────────

interface AsyncStateViewProps<T> {
  loading: boolean;
  error: string | null;
  data: T | null | undefined;
  onRetry?: () => void;
  /** 데이터가 있지만 빈 배열/객체일 때 표시할 메시지 */
  emptyMessage?: string;
  /** 빈 상태 커스텀 아이콘 (기본값: '🔍') */
  emptyIcon?: string;
  /** 로딩 중 보여줄 UI (미지정 시 기본 스피너) */
  loadingView?: ReactNode;
  /** 데이터가 정상일 때 렌더링 */
  children: (data: T) => ReactNode;
  /** isEmpty 판별 함수 (기본: Array면 length===0 체크, 나머지는 항상 false) */
  isEmpty?: (data: T) => boolean;
  className?: string;
}

// ── 기본 스피너 ────────────────────────────────────────────────────────
function DefaultSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
      >
        <RefreshCw size={28} className="text-[#1B4332] opacity-30" />
      </motion.div>
      <p className="text-xs font-bold text-black/20 uppercase tracking-[0.25em]">Loading...</p>
    </div>
  );
}

// ── 에러 뷰 ────────────────────────────────────────────────────────────
function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle size={24} className="text-red-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-black text-black/60">데이터를 불러오지 못했습니다</p>
        <p className="text-xs text-black/30 font-medium max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-black shadow-lg shadow-green-900/20 hover:bg-[#2D6A4F] transition-colors"
        >
          <RefreshCw size={13} />
          다시 시도
        </motion.button>
      )}
    </motion.div>
  );
}

// ── 빈 상태 뷰 ─────────────────────────────────────────────────────────
function EmptyView({ message, icon }: { message: string; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-3 text-center"
    >
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-bold text-black/30">{message}</p>
    </motion.div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────

/**
 * 비동기 데이터의 loading / error / empty / 데이터 상태를 처리하는 공통 래퍼.
 *
 * @example
 * <AsyncStateView loading={loading} error={error} data={items} onRetry={refetch}>
 *   {(data) => <ItemList items={data} />}
 * </AsyncStateView>
 */
export function AsyncStateView<T>({
  loading,
  error,
  data,
  onRetry,
  emptyMessage = '데이터가 없습니다.',
  emptyIcon = '🔍',
  loadingView,
  children,
  isEmpty,
  className = '',
}: AsyncStateViewProps<T>) {
  const isEmptyData = (d: T): boolean => {
    if (isEmpty) return isEmpty(d);
    if (Array.isArray(d)) return d.length === 0;
    return false;
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" className={className}>
          {loadingView ?? <DefaultSpinner />}
        </motion.div>
      ) : error ? (
        <motion.div key="error" className={className}>
          <ErrorView message={error} onRetry={onRetry} />
        </motion.div>
      ) : data == null || isEmptyData(data) ? (
        <motion.div key="empty" className={className}>
          <EmptyView message={emptyMessage} icon={emptyIcon} />
        </motion.div>
      ) : (
        <motion.div key="data" className={className}>
          {children(data)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── useAsyncState 와 함께 사용하는 타입 재수출 ─────────────────────────
export type { AsyncStateViewProps };
