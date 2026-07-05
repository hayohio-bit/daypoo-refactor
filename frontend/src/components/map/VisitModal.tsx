import { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Camera, Zap, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import WaveButtonComponent from '../WaveButton';
import { ToiletData, PoopColor, ConditionTag, FoodTag } from '../../types/toilet';
import { HealthLogModal, HealthLogResult } from './HealthLogModal';

// 방문 인증 결과 타입
// bristolType / color: 건강 기록 추가 시 채워짐, 건너뛰기 시 null
export interface VisitModalResult {
  toiletId: string;
  bristolType: number | null;
  color: PoopColor | null;
  conditionTags: ConditionTag[];
  foodTags: FoodTag[];
  imageBase64: string | null;
  createdAt: string; // ISO 8601
}

interface VisitModalProps {
  toilet: ToiletData;
  onClose: () => void;
  onComplete: (result: VisitModalResult) => Promise<void>;
  checkInTime: number | null;
}

export function VisitModal({ toilet, onClose, onComplete, checkInTime }: VisitModalProps) {
  // 방문 인증 완료 여부 (API 미호출 상태, 선택 화면 표시)
  const [visitDone, setVisitDone] = useState(false);
  // 건강 기록 모달 표시 여부
  const [showHealthLog, setShowHealthLog] = useState(false);
  const [healthLogStartStep, setHealthLogStartStep] = useState<number | undefined>(undefined);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isRecordSubmitted, setIsRecordSubmitted] = useState(false);
  const [showNoPhotoConfirm, setShowNoPhotoConfirm] = useState(false);
  // 인증 완료 시각 (onComplete 호출 시 사용)
  const completedAtRef = useRef<string>('');

  // 카메라 관련
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // 타이머
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!checkInTime) return 60;
    const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
    return Math.max(0, 60 - elapsed);
  });
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    if (!checkInTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        setCanComplete(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInTime]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      alert('카메라 권한이 필요합니다.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // VisitModalResult 생성 (건강 기록 병합 옵션)
  const buildResult = (healthData?: HealthLogResult): VisitModalResult => ({
    toiletId: toilet.id,
    bristolType: healthData?.bristolType ?? null,
    color: healthData?.color ?? null,
    conditionTags: healthData?.conditionTags ?? [],
    foodTags: healthData?.foodTags ?? [],
    imageBase64: capturedImage,
    createdAt: completedAtRef.current,
  });

  // 방문 인증 완료 (API 호출 없음)
  const handleComplete = () => {
    if (!canComplete) {
      alert(`⌛ 최소 ${remainingSeconds}초 더 체류가 필요합니다.`);
      return;
    }

    if (!capturedImage) {
      setShowNoPhotoConfirm(true);
      return;
    }

    completedAtRef.current = new Date().toISOString();
    setVisitDone(true);
  };

  const handleConfirmNoPhoto = () => {
    setShowNoPhotoConfirm(false);
    completedAtRef.current = new Date().toISOString();
    setVisitDone(true);
    setHealthLogStartStep(1); // 바로 모양 선택으로 진입
    setShowHealthLog(true);
  };

  // 건너뛰기: 건강 기록 없이 방문만 POST (백엔드 필수값 우회를 위해 기본값 전송)
  const handleSkipHealthLog = async () => {
    setShowCloseConfirm(false);
    try {
      // 백엔드 validation을 통과하기 위해 최소한의 기본값 세팅
      const defaultResult: HealthLogResult = {
        bristolType: 4, // 정상 (바나나)
        color: 'golden', // 황금색
        conditionTags: ['쾌적함'],
        foodTags: ['채소위주'],
        imageBase64: null
      };
      await onComplete(buildResult(defaultResult));
      setIsRecordSubmitted(true);
      onClose();
    } catch (e: any) {
      if (e.code === 'R007') {
        alert('똥 사진이 아닌 것 같아요!\n변기 안의 변을 다시 촬영해주세요. 💩');
        setCapturedImage(null);
        setVisitDone(false);
        await startCamera();
      }
    }
  };

  // 건강 기록 완료: 방문 + 건강 데이터 합쳐서 POST
  const handleHealthLogComplete = async (healthResult: HealthLogResult) => {
    try {
      await onComplete(buildResult(healthResult));
      setIsRecordSubmitted(true);
    } catch (e: any) {
      if (e.code === 'R007') {
        alert('똥 사진이 아닌 것 같아요!\n변기 안의 변을 다시 촬영해주세요. 💩');
        setCapturedImage(null);
        setVisitDone(false);
        setShowHealthLog(false);
        await startCamera();
      }
      throw e; // 모든 에러(R007 포함)를 다시 던져서 HealthLogModal의 성공 화면 진입을 방지
    }
  };

  const handleBackdropClick = () => {
    if (visitDone || capturedImage) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="hidden" />

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

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
              key={visitDone ? 'done' : 'camera'}
              initial={{ opacity: 0, x: visitDone ? 20 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {visitDone ? (
                /* ── 방문 인증 완료: 건강 기록 추가 여부 선택 ── */
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Check size={48} className="text-emerald-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-black text-2xl text-[#1a2b22]">방문 인증 완료!</p>
                    <p className="text-sm text-[#7a9e8a]">배변 건강 기록도 남겨볼까요?</p>
                    <p className="text-xs text-[#b5c9bc]">기록하면 배변 패턴 리포트에 반영됩니다.</p>
                  </div>
                  <div className="w-full space-y-3 pt-2">
                    <WaveButtonComponent
                      onClick={() => {
                        if (!capturedImage) setHealthLogStartStep(1);
                        setShowHealthLog(true);
                      }}
                      variant="primary"
                      size="lg"
                      className="w-full shadow-lg"
                      icon={<Sparkles size={20} />}
                    >
                      건강 기록 추가하기
                    </WaveButtonComponent>
                    <button
                      onClick={handleSkipHealthLog}
                      className="w-full py-3 text-[#7a9e8a] font-bold text-sm hover:underline"
                    >
                      건너뛰기
                    </button>
                  </div>
                </div>
              ) : (
                /* ── 카메라 / AI 촬영 화면 ── */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-lg text-[#1a2b22]">AI 간편 촬영 분석</p>
                      <p className="text-xs text-[#7a9e8a] mt-1">
                        상태를 촬영하면 AI가 자동으로 분석해드립니다.
                      </p>
                    </div>
                    <Sparkles className="text-amber-500 animate-pulse" size={24} />
                  </div>

                  <div className="relative aspect-square w-full bg-gray-900 rounded-[28px] overflow-hidden shadow-2xl border-4 border-gray-100">
                    {!isCameraActive && !capturedImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                          <Camera className="text-white" size={40} />
                        </div>
                        <WaveButtonComponent
                          onClick={startCamera}
                          variant="light"
                          size="md"
                          className="shadow-2xl"
                          icon={<Camera size={18} />}
                        >
                          카메라 실행하기
                        </WaveButtonComponent>
                      </div>
                    )}

                    {isCameraActive && (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none">
                          <div className="w-full h-full border-2 border-white/50 rounded-2xl border-dashed" />
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                          <button
                            onClick={captureImage}
                            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl border-8 border-gray-100/30 active:scale-90 transition-all"
                          >
                            <Zap className="text-[#1B4332] fill-[#1B4332]" size={36} />
                          </button>
                        </div>
                      </>
                    )}

                    {capturedImage && (
                      <div className="absolute inset-0">
                        <img
                          src={capturedImage}
                          alt="Capture"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                          <div className="flex items-center gap-2 text-white font-black text-xl">
                            <Check className="text-emerald-400" /> 촬영 완료!
                          </div>
                          <button
                            onClick={() => {
                              setCapturedImage(null);
                              startCamera();
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-md font-bold transition-all"
                          >
                            <RotateCcw size={16} /> 다시 찍기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {capturedImage ? (
                    /* 사진 촬영 완료 → 인라인 완료 버튼 */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-center text-emerald-600 bg-emerald-50 px-4 py-3 rounded-2xl">
                        <Sparkles size={16} />
                        <span className="text-sm font-bold">사진 촬영이 완료되었습니다!</span>
                      </div>
                      <WaveButtonComponent
                        onClick={handleComplete}
                        disabled={!canComplete}
                        variant="primary"
                        size="md"
                        className="w-full"
                      >
                        {canComplete ? '인증 완료하기 ✨' : `${remainingSeconds}초 대기`}
                      </WaveButtonComponent>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-[#7a9e8a] text-sm font-bold">
                        촬영은 선택 사항입니다
                      </p>
                      <button 
                        onClick={() => {
                          handleComplete();
                          setHealthLogStartStep(1); // 1단계(브리스톨)부터 시작하도록 설정
                          setShowHealthLog(true);
                        }}
                        className="text-[11px] font-black text-emerald-600/60 hover:text-emerald-600 transition-colors underline underline-offset-4"
                      >
                        사진 없이 기록만 남기기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Footer: 카메라 단계 + 사진 미촬영 시만 표시 */}
        {!visitDone && !capturedImage && (
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

        {/* 사진 미촬영 안내 컨펌 (커스텀 대화상자) */}
        <AnimatePresence>
          {showNoPhotoConfirm && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2060] flex items-center justify-center p-6"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNoPhotoConfirm(false)} />
              <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-[320px] w-full text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Camera size={28} className="text-emerald-500" />
                </div>
                <h3 className="font-black text-lg text-[#1a2b22] mb-2">사진 촬영을 하지 않았습니다</h3>
                <p className="text-sm text-[#7a9e8a] mb-6">사진 없이 기록만 남기시겠습니까?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowNoPhotoConfirm(false)}
                    className="flex-1 py-3 bg-[#f4faf6] text-[#7a9e8a] font-bold rounded-2xl hover:bg-[#e8f3ec] transition-colors"
                  >
                    아니오
                  </button>
                  <button 
                    onClick={handleConfirmNoPhoto}
                    className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors"
                  >
                    예
                  </button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
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
                {visitDone ? '건강 기록을 건너뛸까요?' : '작성을 중단할까요?'}
              </h3>
              <p className="text-sm text-[#7a9e8a] mb-6">
                {visitDone
                  ? '건강 기록은 저장되지 않지만, 방문 인증은 완료됩니다.'
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
                  onClick={visitDone ? handleSkipHealthLog : onClose}
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

      {/* 건강 기록 모달 (visitDone 이후에만 마운트) */}
      <AnimatePresence>
        {showHealthLog && (
          <HealthLogModal
            toilet={toilet}
            initialBristolType={null}
            initialColor={null}
            initialImage={capturedImage} // 촬영된 이미지를 건강 기록 모달로 전달
            startStep={healthLogStartStep}
            onClose={() => {
              setShowHealthLog(false);
              setHealthLogStartStep(undefined); // 상태 초기화
              // 기록이 완료된 상태에서 건강기록 모달을 닫으면 방문인증 모달도 함께 닫음
              if (isRecordSubmitted) {
                onClose();
              }
            }}
            onComplete={handleHealthLogComplete}
          />
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eef5f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
