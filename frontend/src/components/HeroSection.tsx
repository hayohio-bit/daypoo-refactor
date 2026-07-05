import { m, useSpring, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, MapPin, Sparkles, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaveButton from './WaveButton';
import { useAuth } from '../context/AuthContext';
import { TimelineSteps } from './TimelineSteps';
import { BlobStatsSection } from './BlobStatsSection';
import { WaveDivider } from './WaveDivider';
import { useToilets } from '../hooks/useToilets';

// Premium Rolling Counter Component
function RollingCounter({
  value,
  duration = 2,
  delay = 0,
  suffix = '',
}: {
  value: number;
  duration?: number;
  delay?: number;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(0, value, {
        duration,
        ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for a "Framer" feel
        onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      });
      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

// Data Analysis Pipeline — lane positions (% from top)
const FLOW_LANES = [20, 48, 76];

// Particles flowing through each lane
const FLOW_DOTS = [
  { lane: 0, speed: 4.2, delay: 0, size: 4 },
  { lane: 1, speed: 3.4, delay: 0.5, size: 6 },
  { lane: 2, speed: 4.6, delay: 1.2, size: 4 },
  { lane: 0, speed: 3.8, delay: 2.0, size: 3 },
  { lane: 1, speed: 3.6, delay: 2.5, size: 5 },
  { lane: 2, speed: 4.0, delay: 3.2, size: 3 },
  { lane: 1, speed: 3.2, delay: 4.0, size: 4 },
];

const PIPELINE_LABELS = [
  { text: '기록 수집', x: '6%', y: '10%', delay: 0.3 },
  { text: 'AI 분석 중', x: '42%', y: '84%', delay: 2.0 },
  { text: '패턴 감지', x: '78%', y: '10%', delay: 3.8 },
];

interface HeroSectionProps {
  onCtaClick: () => void;
  openAuth: (mode: 'login' | 'signup') => void;
}

export function HeroSection({ onCtaClick, openAuth }: HeroSectionProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mobile detection for performance optimization
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const onRecordClick = useCallback(() => {
    navigate('/map');
  }, [navigate]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('위치 확인 중...');
  const [stats, setStats] = useState({
    todayReports: 2648,
    accuracy: 98.2,
    totalToilets: 72142,
  });

  const { toilets, loading: toiletsLoading } = useToilets({
    lat: userLocation?.lat || 37.5666,
    lng: userLocation?.lng || 126.9784,
    radius: 1500,
  });

  useEffect(() => {
    // We removed the automatic geolocation prompt from here to avoid double-pops
    // The LocationConsentBanner now handles the first intent.

    // Default location to Seoul while waiting
    setUserLocation({ lat: 37.5666, lng: 126.9784 });
    setLocationName('서울시 중구');

    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        todayReports: prev.todayReports + (Math.random() > 0.7 ? 1 : 0),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    toiletsLoading
      ? '데이터 동기화 중...'
      : `근처에서 가장 청결한 ${toilets.length}개의 화장실 발견`,
    'AI가 분석한 오늘의 최적 쾌변 장소 추천',
    '실시간으로 업데이트되는 깨끗한 한 칸 찾기',
    '지금 내 주변 평점 높은 화장실 리스트',
    '급할 때 가장 빠르게 가는 비밀 장소 공개',
    '데이터로 확인하는 안심 화장실 네트워크',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center bg-[#111E18] overflow-hidden px-4 sm:px-8 pt-24 pb-16 sm:pt-32 sm:pb-32">
        {/* Deep Ambient Background — mobile uses simple gradient, desktop keeps blur */}
        {isMobile ? (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)',
            }}
          />
        ) : (
          <div className="absolute inset-0 opacity-[0.2] pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-emerald-500/10 blur-[180px] rounded-full" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
          </div>
        )}

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-center relative z-20">
          {/* Left Content: Fade In Layout */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-10 text-left">
            <m.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-max">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Zap size={11} className="text-emerald-400" />
                <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                  실시간 건강 엔진 작동 중
                </span>
              </div>

              <h1 className="text-[2.25rem] sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-white tracking-tight">
                건강은 <br />
                <span className="text-emerald-400">데이터</span>로 말합니다.
              </h1>

              <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed max-w-lg">
                단순한 지도가 아닙니다. 사용자의 기록과 AI 분석이 결합된{' '}
                <br className="hidden md:block" />
                프리미엄 라이프 케어 시스템.
              </p>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-5 pt-4"
            >
              <WaveButton onClick={onCtaClick} variant="primary" className="px-8 py-4 text-[15px]">
                가까운 화장실 찾기
              </WaveButton>
              <WaveButton
                onClick={onRecordClick}
                variant="accent"
                className="px-8 py-4 text-[15px] shadow-lg shadow-amber-500/20"
              >
                기록하러 가기
              </WaveButton>
            </m.div>
          </div>

          {/* Right Widget: High-end Dashboard */}
          <div className="lg:col-span-5 relative">
            <m.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative p-6 sm:p-10 rounded-[48px] border border-white/5 shadow-xl sm:shadow-3xl space-y-6 sm:space-y-10 ${isMobile ? 'bg-[#1a2b22]/90' : 'bg-[#1a2b22]/40 backdrop-blur-3xl'}`}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-emerald-500/[0.08] border border-emerald-500/10 text-center space-y-2">
                  <div className="text-emerald-400 text-3xl font-black tabular-nums tracking-tighter">
                    <RollingCounter value={stats.todayReports} delay={0.6} />
                  </div>
                  <div className="text-[10px] text-emerald-300/50 font-black uppercase tracking-widest">
                    오늘의 리포트
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 text-center space-y-2">
                  <div className="text-white text-3xl font-black tabular-nums tracking-tighter">
                    <RollingCounter value={98} suffix=".2%" delay={0.8} />
                  </div>
                  <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                    분석 정확도
                  </div>
                </div>
              </div>

              {/* Data Analysis Pipeline — Completely removed on mobile for zero lag */}
              {!isMobile && (
                <div className="hidden md:block space-y-5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Activity size={12} className="text-emerald-500" /> 실시간 AI 데이터 분석
                      파이프라인
                    </span>
                    <span className="text-emerald-400 animate-pulse flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />{' '}
                      LIVE
                    </span>
                  </div>

                  <div
                    className="h-32 w-full relative overflow-hidden rounded-[24px] border border-emerald-500/[0.1] shadow-inner"
                    style={{ background: '#0a1410' }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle, #34d399 1.5px, transparent 1.5px)',
                        backgroundSize: '24px 24px',
                      }}
                    />

                    {/* Enhanced Data Flow Lanes */}
                    {FLOW_LANES.map((y, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 h-[1.5px]"
                        style={{
                          top: `${y}%`,
                          background:
                            'linear-gradient(to right, transparent, rgba(52,211,153,0.1), transparent)',
                        }}
                      />
                    ))}

                    {/* Central Glow Hub */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                      <div className="absolute w-20 h-20 rounded-full bg-emerald-400/10 blur-lg" />
                      <div className="relative w-12 h-12 rounded-2xl border border-emerald-400/20 bg-emerald-950/60 flex items-center justify-center">
                        <m.div
                          className="w-3 h-3 rounded bg-emerald-400"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          style={{ willChange: 'transform' }}
                        />
                      </div>
                    </div>

                    {/* Flowing Data Particles */}
                    {FLOW_DOTS.map((dot, i) => (
                      <m.div
                        key={i}
                        className="absolute rounded-full z-20"
                        style={{
                          width: dot.size,
                          height: dot.size,
                          top: `${FLOW_LANES[dot.lane]}%`,
                          background: '#34d399',
                          willChange: 'left, opacity',
                        }}
                        animate={{
                          left: ['0%', '100%'],
                          opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                          duration: dot.speed,
                          delay: dot.delay,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    ))}

                    {/* Pipeline Status Labels */}
                    {PIPELINE_LABELS.map((label, i) => (
                      <m.span
                        key={i}
                        className="absolute text-[8px] font-black uppercase tracking-wider text-emerald-400/40 pointer-events-none z-20"
                        style={{ left: label.x, top: label.y }}
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ duration: 4, delay: label.delay, repeat: Infinity }}
                      >
                        {label.text}
                      </m.span>
                    ))}

                    <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0a1410] to-transparent z-30 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0a1410] to-transparent z-30 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Real-time Location Widget */}
              <div
                onClick={onCtaClick}
                className="flex gap-5 p-5 rounded-[28px] bg-white/[0.02] border border-white/5 items-center group cursor-pointer hover:bg-white/[0.05] transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <MapPin size={28} />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    {locationName}
                    <m.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-emerald-400 text-[10px]"
                    >
                      CURRENT
                    </m.span>
                  </div>
                  <div className="relative min-h-[1.5rem] flex items-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      <m.div
                        key={messageIndex}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[11px] sm:text-[13px] text-slate-400 font-bold leading-tight"
                      >
                        {messages[messageIndex]}
                      </m.div>
                    </AnimatePresence>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0 transition-all duration-300 group-hover:scale-110">
                  <ChevronRight size={18} />
                </div>
              </div>
            </m.div>

            {!isMobile && (
              <>
                <div className="absolute -top-16 -right-16 w-60 h-60 bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
              </>
            )}
          </div>
        </div>

        <WaveDivider fill="#F8FAF9" />
      </section>

      <section
        id="steps-section"
        className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden bg-[#F8FAF9]"
      >
        <div className="max-w-5xl mx-auto mb-12">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-emerald-600">
              HOW IT WORKS
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              3단계로 끝나는 <br />
              <span className="text-emerald-600">스마트 라이프</span>
            </h2>
          </m.div>
          <TimelineSteps openAuth={openAuth} />
        </div>
        <WaveDivider fill="#eef5f0" />
      </section>
    </>
  );
}
