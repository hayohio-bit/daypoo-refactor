import { useState, useEffect, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, AlertTriangle, Sparkles, Camera, Zap, RotateCcw } from 'lucide-react';
import WaveButtonComponent from '../WaveButton';
import {
  ToiletData,
  PoopColor,
  ConditionTag,
  FoodTag,
  POOP_COLORS,
  CONDITION_TAGS,
  FOOD_TAGS,
} from '../../types/toilet';

export interface HealthLogResult {
  bristolType: number | null;
  color: PoopColor | null;
  conditionTags: ConditionTag[];
  foodTags: FoodTag[];
  imageBase64: string | null;
}

interface HealthLogModalProps {
  toilet?: ToiletData | null;
  initialBristolType?: number | null;
  initialColor?: PoopColor | null;
  initialImage?: string | null;
  startStep?: number; // 추가: 시작 단계를 외부에서 지정
  onClose: () => void;
  onComplete: (result: HealthLogResult) => Promise<void>;
}

const STEPS = ['AI 촬영', '모양 선택', '색상 선택', '추가 정보'];

const BRISTOL_DETAILS = [
  { type: 1, emoji: '🪨', label: '딱딱한 알맹이', desc: '분리된 딱딱한 덩어리', fullDesc: '수분이 극도로 부족한 상태로, 심한 변비를 의미합니다. 장내 체류 시간이 길어져 돌멩이처럼 딱딱한 배변이 발생합니다.', status: '심한 변비', color: '#8d6e63' },
  { type: 2, emoji: '🥖', label: '단단한 소시지형', desc: '덩어리가 뭉친 소시지 모양', fullDesc: '수분이 다소 부족하여 바게트처럼 단단하게 덩어리들이 뭉치 있습니다. 가벼운 변비가 의심되며 수분 섭취가 권장됩니다.', status: '변비 경향', color: '#a1887f' },
  { type: 3, emoji: '🥜', label: '갈라진 소시지형', desc: '표면에 균열이 있는 소시지', fullDesc: '정상 범주에 속하지만 땅콩 껍질처럼 다소 표면에 균열이 있고 단단할 수 있습니다. 규칙적인 생활과 섬유질 섭취가 도움이 됩니다.', status: '정상 (다소 단단)', color: '#bcaaa4' },
  { type: 4, emoji: '🍌', label: '매끄러운 바나나', desc: '부드럽고 매끄러운 바나나 모양', fullDesc: '가장 이상적인 건강 상태입니다! 뱀처럼 부드럽고 매끈하며 적절한 탄력을 가진 최고의 컨디션입니다.', status: '매우 건강함', color: '#8BC34A' },
  { type: 5, emoji: '🫘', label: '폭신한 덩어리 모양', desc: '부드러운 덩어리, 경계 뚜렷', fullDesc: '부드러운 알맹이 형태로 경계가 뚜렷합니다. 전반적으로 양호한 상태이며 원활한 소화가 이루어지고 있습니다.', status: '양호 (약간 무름)', color: '#4caf50' },
  { type: 6, emoji: '🍮', label: '흐물흐물한 푸딩형', desc: '경계가 불분명하고 무른 모양', fullDesc: '푸딩처럼 형태가 불분명하고 매우 무른 상태입니다. 설사로 진행되기 직전이므로 자극적인 음식 섭취를 피하고 장 휴식을 권장합니다.', status: '경미한 설사', color: '#ff9800' },
  { type: 7, emoji: '💧', label: '물 같은 액체 상태', desc: '덩어리가 전혀 없는 액체', fullDesc: '심한 설사 상태입니다. 수분 손실이 많으므로 전해질 보충이 시급하며 탈수에 강한 주의가 필요합니다.', status: '심한 설사', color: '#f44336' },
];

export function HealthLogModal({
  toilet,
  initialBristolType,
  initialColor,
  initialImage,
  startStep,
  onClose,
  onComplete,
}: HealthLogModalProps) {
  // 에너테이션: 외부에서 지정한 startStep이 있으면 우선, 아니면 이미지 유무에 따라 결정
  const [step, setStep] = useState(startStep ?? (initialImage ? 1 : 0));
  const [bristolType, setBristolType] = useState<number | null>(initialBristolType ?? null);
  const [color, setColor] = useState<PoopColor | null>(initialColor ?? null);
  const [conditions, setConditions] = useState<ConditionTag[]>([]);
  const [foods, setFoods] = useState<FoodTag[]>([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isNextHovered, setIsNextHovered] = useState(false);
  const [hoveredBristol, setHoveredBristol] = useState<number | null>(null);
  const [hoveredColor, setHoveredColor] = useState<PoopColor | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage ?? null);

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
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
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
    // 0.8초 후 자동으로 넘어가던 로직 제거 (사용자가 명시적으로 다음 버튼을 누르게 함)
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleNext = async () => {
    // 사진이 이미 찍힌 경우 0단계에서 바로 완료 가능하도록 처리
    if (step === 0 && capturedImage) {
      try {
        await onComplete({
          bristolType: null,
          color: null,
          conditionTags: [],
          foodTags: [],
          imageBase64: capturedImage,
        });
        setIsSuccess(true);
      } catch (e: any) {
        console.error('기록 저장 실패:', e);
        if (e.code === 'R007') {
          setCapturedImage(null); // AI 인식 실패 시 촬영 이미지 초기화
        }
      }
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        await onComplete({
          bristolType,
          color,
          conditionTags: conditions,
          foodTags: foods,
          imageBase64: capturedImage,
        });
        setIsSuccess(true);
      } catch (e: any) {
        console.error('기록 저장 실패:', e);
        if (e.code === 'R007') {
          setCapturedImage(null);
          setStep(0); // 촬영 단계로 되돌림
        }
      }
    }
  };

  const handleBackdropClick = () => {
    if (bristolType !== null || color !== null || conditions.length > 0 || foods.length > 0) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleBackdropClick} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`relative z-10 w-full bg-white rounded-[32px] overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${step === 1 ? 'max-w-[780px]' : 'max-w-[480px]'}`}
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 px-8 space-y-8 min-h-[460px]">
            <div className="relative">
              <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check size={48} className="text-emerald-500" />
              </m.div>
              <m.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -top-2 -right-2">
                <Sparkles size={24} className="text-amber-400" />
              </m.div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="font-black text-3xl text-[#1a2b22] tracking-tight">기록 완료!</h2>
              <p className="text-sm text-[#7a9e8a] font-medium leading-relaxed">성공적으로 보관되었습니다.<br />변화하는 건강 데이터를 리포트로 확인해보세요.</p>
            </div>
            <div className="w-full space-y-3 pt-6">
              <WaveButtonComponent variant="primary" size="lg" className="w-full shadow-lg" onClick={() => { window.location.href = '/mypage?tab=report'; }} icon={<ChevronRight size={20} />}>기록 보러가기</WaveButtonComponent>
              <button onClick={onClose} className="w-full py-3 text-[#b5c9bc] font-bold text-sm hover:text-[#7a9e8a] transition-colors">닫기</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef5f0]">
              <div>
                {toilet && <p className="text-[10px] font-bold text-[#7a9e8a] uppercase tracking-wider">{toilet.name}</p>}
                <h2 className="font-black text-xl text-[#1a2b22]">배변 건강 기록</h2>
              </div>
              <button onClick={handleBackdropClick} className="w-10 h-10 rounded-full bg-[#f4faf6] text-[#7a9e8a] flex items-center justify-center hover:bg-[#e8f3ec] transition-colors"><X size={20} /></button>
            </div>

            <div className="flex items-center px-6 py-4 gap-1.5 bg-[#fcfdfc] border-b border-[#eef5f0]">
              {STEPS.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#eef5f0]">
                  <m.div initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} className="h-full bg-[#1B4332] w-full origin-left" />
                </div>
              ))}
            </div>

            <div className="flex-1 px-6 py-6 custom-scrollbar min-h-[360px] overflow-y-auto">
              <AnimatePresence mode="wait">
                <m.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  {step === 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-lg text-[#1a2b22]">AI 간편 촬영 분석</p>
                          <p className="text-xs text-[#7a9e8a] mt-1">상태를 촬영하면 AI가 자동으로 분석해드립니다.</p>
                        </div>
                        <Sparkles className="text-amber-500 animate-pulse" size={24} />
                      </div>
                      <div className="relative aspect-square w-full bg-gray-900 rounded-[28px] overflow-hidden shadow-2xl border-4 border-gray-100">
                        <canvas ref={canvasRef} className="hidden" />
                        {!isCameraActive && !capturedImage && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md"><Camera className="text-white" size={40} /></div>
                            <WaveButtonComponent onClick={startCamera} variant="accent" size="md" className="shadow-xl" icon={<Camera size={20} className="animate-pulse" />}>카메라 실행하기</WaveButtonComponent>
                            <p className="mt-3 text-[10px] text-[#7a9e8a]/70 font-bold tracking-tight">촬영은 선택사항이며, 언제든 직접 입력 가능합니다.</p>
                          </div>
                        )}
                        {isCameraActive && (
                          <>
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                            <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none"><div className="w-full h-full border-2 border-white/50 rounded-2xl border-dashed" /></div>
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center"><button onClick={captureImage} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl border-8 border-gray-100/30 active:scale-90 transition-all"><Zap className="text-[#1B4332] fill-[#1B4332]" size={36} /></button></div>
                          </>
                        )}
                        {capturedImage && (
                          <div className="absolute inset-0">
                            <img src={capturedImage} alt="Capture" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                              <div className="flex items-center gap-2 text-white font-black text-xl"><Check className="text-emerald-400" /> 촬영 완료!</div>
                              <button onClick={() => { setCapturedImage(null); startCamera(); }} className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-md font-bold transition-all"><RotateCcw size={16} /> 다시 찍기</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div><p className="font-black text-2xl text-[#1a2b22] md:text-xl">모양 선택</p><p className="text-base text-[#7a9e8a] mt-0.5 md:text-sm">상태에 가장 가까운 모양을 선택해주세요.</p></div>
                        <div className="grid gap-1.5">
                          {BRISTOL_DETAILS.map((b) => (
                            <button
                              key={b.type} onClick={() => setBristolType(b.type)}
                              onMouseEnter={() => setHoveredBristol(b.type)} onMouseLeave={() => setHoveredBristol(null)}
                              className={`flex items-center gap-3.5 p-2.5 rounded-[20px] border-2 transition-all ${bristolType === b.type ? 'border-[#1B4332] bg-[#f4faf6]' : 'border-[#eef5f0] bg-white hover:border-[#1B4332]/30 hover:shadow-sm'}`}
                            >
                              <span className="text-3xl md:text-2xl">{b.emoji}</span>
                              <div className="text-left flex-1"><p className={`text-base font-bold md:text-sm ${bristolType === b.type ? 'text-[#1B4332]' : 'text-[#1a2b22]'}`}>{b.type}단계 · {b.label}</p></div>
                              {bristolType === b.type && <Check size={22} className="text-[#1B4332]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="hidden md:flex flex-col w-[280px] bg-[#1a2b27] rounded-[28px] p-6 shadow-2xl border border-white/10 shrink-0 min-h-[380px]">
                        <AnimatePresence mode="wait">
                          {(hoveredBristol || bristolType) ? (
                            <m.div key={hoveredBristol || bristolType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-5xl shadow-inner">{BRISTOL_DETAILS.find(b => b.type === (hoveredBristol || bristolType))?.emoji}</div>
                              <div className="space-y-2">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-tighter" style={{ color: BRISTOL_DETAILS.find(b => b.type === (hoveredBristol || bristolType))?.color }}>{BRISTOL_DETAILS.find(b => b.type === (hoveredBristol || bristolType))?.status}</span>
                                <h3 className="text-white font-black text-xl leading-tight">{BRISTOL_DETAILS.find(b => b.type === (hoveredBristol || bristolType))?.label}</h3>
                              </div>
                              <p className="text-[#7a9e8a] text-sm font-medium leading-relaxed">{BRISTOL_DETAILS.find(b => b.type === (hoveredBristol || bristolType))?.fullDesc}</p>
                              <div className="pt-4 border-t border-white/5"><p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">진단 가이드</p><div className="mt-2 flex items-center gap-2 text-white/80 text-xs font-bold italic"><Sparkles size={12} className="text-amber-400" />"{BRISTOL_DETAILS.find(b => b.type === (hoveredBristol || bristolType))?.desc}"</div></div>
                            </m.div>
                          ) : (
                            <m.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center space-y-4">
                              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center"><Sparkles size={32} className="text-[#3b5b4a]" /></div>
                              <div className="space-y-1"><p className="text-white font-bold text-base">상태별 가이드</p><p className="text-[#7a9e8a] text-xs leading-relaxed px-4">모양을 선택하거나 마우스를 올려<br />상세 정보를 확인해보세요.</p></div>
                            </m.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div><p className="font-black text-2xl text-[#1a2b22] md:text-xl">어떤 색에 가깝나요?</p><p className="text-base text-[#7a9e8a] mt-1 md:text-sm">가장 일치하는 색상을 골라주세요.</p></div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(Object.entries(POOP_COLORS) as [PoopColor, { hex: string; label: string }][]).map(([key, val]) => (
                          <button
                            key={key} onClick={() => setColor(key)} onMouseEnter={() => setHoveredColor(key)} onMouseLeave={() => setHoveredColor(null)}
                            className={`relative flex flex-col items-center gap-3.5 p-5 rounded-[28px] border-2 transition-all duration-300 group ${color === key ? 'border-[#1B4332] bg-[#f4faf6] shadow-xl' : 'border-[#eef5f0] bg-white hover:border-[#1B4332]/20 hover:scale-[1.02]'}`}
                          >
                            <div className="relative">
                              <AnimatePresence>{color === key && <m.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1, 1.3, 1], opacity: 0.3 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 blur-xl rounded-full" style={{ backgroundColor: val.hex }} />}</AnimatePresence>
                              <div className="w-16 h-16 md:w-14 md:h-14 relative z-10">
                                <m.div
                                  animate={color === key || hoveredColor === key ? { scale: [1, 1.3, 1.3, 1, 1], rotate: [0, 0, 270, 270, 0], borderRadius: ["20%", "20%", "50%", "50%", "20%"] } : { scale: 1, rotate: 0, borderRadius: "50%" }}
                                  transition={color === key || hoveredColor === key ? { duration: 3, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 0.5, 0.8, 1] } : { duration: 0.4, ease: "easeInOut" }}
                                  className="absolute inset-0 shadow-lg" style={{ backgroundColor: val.hex }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-white/15 opacity-50 pointer-events-none rounded-full" />
                              </div>
                            </div>
                            <span className={`text-base font-bold transition-colors md:text-sm ${color === key ? 'text-[#1B4332]' : 'text-[#1a2b22]'}`}>{val.label}</span>
                            {color === key && <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-6 h-6 bg-[#1B4332] rounded-full flex items-center justify-center text-white"><Check size={14} /></m.div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <p className="font-black text-2xl text-[#1a2b22] md:text-xl">상태는 어떠셨나요?</p>
                        <div className="flex flex-wrap gap-2.5">
                          {CONDITION_TAGS.map((tag) => {
                            const isSelected = conditions.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => setConditions(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                                className={`px-5 py-2.5 rounded-full border-2 font-bold text-base md:text-sm transition-all duration-300 ${isSelected
                                    ? 'bg-[#1B4332] border-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20'
                                    : 'bg-white border-[#eef5f0] text-[#7a9e8a] hover:border-[#1B4332]/20'
                                  }`}
                              >
                                #{tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="font-black text-2xl text-[#1a2b22] md:text-xl">최근 드신 음식은?</p>
                        <div className="flex flex-wrap gap-2.5">
                          {FOOD_TAGS.map((tag) => {
                            const isSelected = foods.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => setFoods(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                                className={`px-5 py-2.5 rounded-full border-2 font-bold text-base md:text-sm transition-all duration-300 ${isSelected
                                    ? 'bg-[#E8A838] border-[#E8A838] text-white shadow-lg shadow-[#E8A838]/20'
                                    : 'bg-white border-[#eef5f0] text-[#c49a6c] hover:border-[#E8A838]/20'
                                  }`}
                              >
                                #{tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </m.div>
              </AnimatePresence>
            </div>

            <div className="px-6 py-6 bg-[#fcfdfc] border-t border-[#eef5f0] flex gap-3">
              {step > 0 && <button onClick={() => setStep(step - 1)} className="flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-[#eef5f0] text-[#7a9e8a] hover:bg-[#f4faf6] transition-colors"><ChevronLeft size={24} /></button>}
              <WaveButtonComponent
                onClick={handleNext} onMouseEnter={() => setIsNextHovered(true)} onMouseLeave={() => setIsNextHovered(false)}
                disabled={step === 1 ? !bristolType : step === 2 ? !color : step === 3 ? (conditions.length === 0 || foods.length === 0) : false}
                variant="primary" size="lg" className="flex-1 shadow-lg overflow-hidden group"
              >
                <div className="relative h-6 flex items-center justify-center min-w-[120px]">
                  <AnimatePresence mode="wait">
                    {isNextHovered && step > 0 && (step === 1 ? bristolType : step === 2 ? color : true) ? (
                      <m.div key="check" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.12 }} className="font-black text-white">체크 완료!</m.div>
                    ) : (
                      <m.div key="text" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.12 }} className="flex items-center gap-2">
                        {step === 3 ? (
                          <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-amber-300" />
                            기록 완료하기
                          </div>
                        ) : step === 0 ? (
                          capturedImage ? '기록 완료하기' : '촬영없이 기록하기'
                        ) : (
                          '다음 단계로'
                        )}
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </WaveButtonComponent>
            </div>
          </>
        )}
      </m.div>

      <AnimatePresence>
        {showCloseConfirm && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCloseConfirm(false)} />
            <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-[320px] w-full text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-[#FFF3E0] flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} className="text-[#E8A838]" /></div>
              <h3 className="font-black text-lg text-[#1a2b22] mb-2">기록을 중단할까요?</h3>
              <p className="text-sm text-[#7a9e8a] mb-6">{toilet ? '방문 인증은 유지되며, 건강 기록만 취소됩니다.' : '입력한 내용이 사라집니다.'}</p>
              <div className="flex gap-3">
                <WaveButtonComponent onClick={() => setShowCloseConfirm(false)} variant="outline" size="md" className="flex-1">계속 작성</WaveButtonComponent>
                <WaveButtonComponent onClick={onClose} variant="error" size="md" className="flex-1">나가기</WaveButtonComponent>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eef5f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
