import { AnimatePresence, m } from 'framer-motion';
import { AlertTriangle, Check, Clock, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import type { ConditionTag, FoodTag, PoopColor, ToiletData } from '../../types/toilet';
import WaveButtonComponent from '../WaveButton';
import { BaseModal } from '../common/BaseModal';

// 방문 인증 결과 타입
// bristolType / color: 상태 기록 추가 시 채워짐, 건너뛰기 시 null
export interface VisitModalResult {
  toiletId: string;
  bristolType: number | null;
  color: PoopColor | null;
  conditionTags: ConditionTag[];
  foodTags: FoodTag[];
  createdAt: string; // ISO 8601
}

interface VisitModalProps {
  toilet: ToiletData;
  onClose: () => void;
  onComplete: (result: VisitModalResult) => Promise<void>;
  checkInTime: number | null;
}

/** 인증에 필요한 최소 체류 시간(초). 백엔드 STAY_TIME_NOT_MET 판정과 같은 값이다. */
const REQUIRED_STAY_SECONDS = 60;

export function VisitModal({ toilet, onClose, onComplete, checkInTime }: VisitModalProps) {
  // 방문 인증 완료 여부
  const { notifyError, notifyInfo } = useFeedback();
  const [visitDone, setVisitDone] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  // 인증 완료 시각 (onComplete 호출 시 사용)
  const completedAtRef = useRef<string>('');

  // 타이머
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!checkInTime) return REQUIRED_STAY_SECONDS;
    const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
    return Math.max(0, REQUIRED_STAY_SECONDS - elapsed);
  });
  // 남은 시간에서 유도한다. 별도 상태로 두면 첫 렌더에서 두 값이 어긋난다.
  const canComplete = remainingSeconds === 0;

  useEffect(() => {
    if (!checkInTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
      const remaining = Math.max(0, REQUIRED_STAY_SECONDS - elapsed);
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInTime]);

  // VisitModalResult 생성
  const buildResult = (): VisitModalResult => ({
    toiletId: toilet.id,
    bristolType: 4, // 정상 기본값
    color: 'golden',
    conditionTags: ['쾌적함'],
    foodTags: ['채소위주'],
    createdAt: completedAtRef.current,
  });

  // 방문 인증 완료 (API 호출 없음)
  const handleComplete = () => {
    if (!canComplete) {
      notifyInfo(`최소 ${remainingSeconds}초 더 체류해야 인증할 수 있습니다.`, '체류 시간 부족');
      return;
    }

    completedAtRef.current = new Date().toISOString();
    setVisitDone(true);
  };

  // 방문 인증 완료 처리
  const handleVisitComplete = async () => {
    try {
      await onComplete(buildResult());
      onClose();
    } catch (e) {
      notifyError(e, '인증 실패');
    }
  };

  const handleBackdropClick = () => {
    if (visitDone) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <BaseModal onClose={handleBackdropClick} zIndex={2000}>
      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef5f0]">
          <div>
            <p className="text-[10px] font-bold text-[#7a9e8a] uppercase tracking-wider">
              {toilet.name}
            </p>
            <h2 className="font-black text-xl text-[#1a2b22] flex items-center gap-2">
              {visitDone ? (
                <>
                  방문 인증 완료 <Check size={20} className="text-emerald-500" />
                </>
              ) : (
                <>
                  방문 인증
                  {remainingSeconds > 0 && (
                    <span className="text-sm font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> {remainingSeconds}s
                    </span>
                  )}
                </>
              )}
            </h2>
          </div>
          <button
            onClick={handleBackdropClick}
            className="w-10 h-10 rounded-full bg-[#f4faf6] text-[#7a9e8a] flex items-center justify-center hover:bg-[#e8f3ec] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar"
          style={{ minHeight: '320px' }}
        >
          <AnimatePresence mode="wait">
            <m.div
              key={visitDone ? 'done' : 'waiting'}
              initial={{ opacity: 0, x: visitDone ? 20 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {visitDone ? (
                /* ── 방문 인증 완료 ── */
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Check size={48} className="text-emerald-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-black text-2xl text-[#1a2b22]">방문 인증 완료!</p>
                    <p className="text-sm text-[#7a9e8a]">화장실 방문이 기록됩니다.</p>
                  </div>
                  <div className="w-full space-y-3 pt-2">
                    <WaveButtonComponent
                      onClick={handleVisitComplete}
                      variant="primary"
                      size="lg"
                      className="w-full shadow-lg"
                      icon={<Sparkles size={20} />}
                    >
                      인증 완료하기
                    </WaveButtonComponent>
                  </div>
                </div>
              ) : (
                /* ── 체류 시간 대기 ── */
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-[#f4faf6] flex items-center justify-center">
                    <Clock size={48} className="text-[#7a9e8a]" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-black text-2xl text-[#1a2b22]">
                      {canComplete ? '인증할 수 있습니다' : `${remainingSeconds}초 남았습니다`}
                    </p>
                    <p className="text-sm text-[#7a9e8a]">
                      화장실에 1분 이상 머무르면 방문이 인증됩니다.
                    </p>
                  </div>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Footer: 인증 완료 전에만 표시 */}
        {!visitDone && (
          <div className="px-6 py-6 bg-[#fcfdfc] border-t border-[#eef5f0]">
            <WaveButtonComponent
              onClick={handleComplete}
              disabled={!canComplete}
              variant="primary"
              size="lg"
              className="w-full shadow-lg"
              icon={<Sparkles size={20} />}
            >
              {canComplete ? '인증하기' : `${remainingSeconds}초 대기 중`}
            </WaveButtonComponent>
          </div>
        )}
      </m.div>

      {/* 닫기 확인 모달 */}
      <AnimatePresence>
        {showCloseConfirm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2050] flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCloseConfirm(false)}
            />
            <m.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-[320px] w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-[#FFF3E0] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-[#E8A838]" />
              </div>
              <h3 className="font-black text-lg text-[#1a2b22] mb-2">
                {visitDone ? '상태 기록을 건너뛸까요?' : '작성을 중단할까요?'}
              </h3>
              <p className="text-sm text-[#7a9e8a] mb-6">
                {visitDone
                  ? '상태 기록은 저장되지 않지만, 방문 인증은 완료됩니다.'
                  : '지금까지 입력한 내용이 사라집니다.'}
              </p>
              <div className="flex gap-3">
                <WaveButtonComponent
                  onClick={() => setShowCloseConfirm(false)}
                  variant="outline"
                  size="md"
                  className="flex-1"
                >
                  계속 작성
                </WaveButtonComponent>
                <WaveButtonComponent
                  onClick={visitDone ? handleVisitComplete : onClose}
                  variant="error"
                  size="md"
                  className="flex-1"
                >
                  {visitDone ? '저장 후 나가기' : '나가기'}
                </WaveButtonComponent>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eef5f0; border-radius: 10px; }
      `}</style>
    </BaseModal>
  );
}
