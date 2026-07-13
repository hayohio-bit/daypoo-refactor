import React, { useRef, MouseEvent } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Zap, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  isAction?: boolean;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: <MapPin size={26} />,
    title: '전국 화장실 실시간 탐색',
    desc: '내 주변 5만 개 공용 화장실 데이터를\n가장 빠르게 찾아보세요.',
    color: '#2D6A4F',
  },
  {
    id: 2,
    icon: <Zap size={26} />,
    title: '스마트한 배변 기록',
    desc: '다녀온 후 브리스톨 척도로 3초 만에\n나의 컨디션을 기록하세요.',
    color: '#E8A838',
  },
  {
    id: 3,
    icon: <Brain size={26} />,
    title: 'AI 배변 패턴 리포트 분석',
    desc: '누적된 데이터를 기반으로 AI가\n나의 장 상태를 분석합니다.',
    color: '#52b788',
  },
  {
    id: 4,
    icon: <Sparkles size={26} />,
    title: '지금 바로 시작하기',
    desc: '첫 기록부터 AI 쾌변 가이드가\n당신과 함께합니다.',
    color: '#1B4332',
    isAction: true,
  },
];

// ── Spotlight Card Component (최신 트렌디한 가로형 레이아웃) ──────────────────────────
function SpotlightCard({
  step,
  index,
  onAction,
}: {
  step: Step;
  index: number;
  onAction?: () => void;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 40 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      className={`relative w-full p-6 sm:p-10 md:p-14 rounded-[28px] sm:rounded-[48px] transition-all duration-700 group overflow-hidden ${
        step.isAction
          ? 'bg-[#1B4332] text-white shadow-[0_40px_100px_rgba(27,67,50,0.35)]'
          : 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100'
      }`}
    >
      {/* 배경 대형 아이콘 (오른쪽 빈 공간을 채우는 데코레이션) */}
      <div
        className={`absolute -right-12 -bottom-12 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110 group-hover:-rotate-12 ${step.isAction ? 'text-white' : ''}`}
        style={{ color: step.isAction ? '#fff' : step.color }}
      >
        {React.isValidElement(step.icon) &&
          React.cloneElement(step.icon as React.ReactElement<any>, { size: 320 })}
      </div>

      {/* Spotlight 효과 */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[48px] opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              800px circle at ${mouseX}px ${mouseY}px,
              ${step.isAction ? 'rgba(255,255,255,0.08)' : step.color + '10'},
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10 md:gap-16">
        {/* 좌측: 번호와 아이콘 (강조) */}
        <div className="flex-shrink-0 relative">
          <div
            className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[32px] flex items-center justify-center shadow-2xl transform transition-all duration-700 group-hover:rotate-[10deg] ${step.isAction ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white border border-gray-50'}`}
            style={{ color: step.isAction ? '#fff' : step.color }}
          >
            {React.isValidElement(step.icon) &&
              React.cloneElement(step.icon as React.ReactElement<any>, { size: 36 })}
          </div>
          <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8A838] flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-lg border-[3px] sm:border-4 border-white">
            0{step.id}
          </div>
        </div>

        {/* 우측: 텍스트 정보 (레이아웃 개선) */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col mb-4">
            <span
              className={`text-[12px] font-black tracking-[0.4em] uppercase mb-2 ${step.isAction ? 'text-emerald-400/50' : 'text-emerald-800/20'}`}
            >
              Roadmap Strategy
            </span>
            <h3
              className={`text-xl sm:text-3xl md:text-5xl font-black mb-3 sm:mb-4 tracking-tighter leading-[1.1] ${step.isAction ? 'text-white' : 'text-[#1B4332]'}`}
            >
              {step.title}
            </h3>
          </div>
          <p
            className={`text-sm sm:text-lg md:text-xl leading-relaxed whitespace-pre-line ${step.isAction ? 'text-white/60' : 'text-gray-500/80 font-medium'}`}
          >
            {step.desc}
          </p>

          {/* 버튼 (마지막 단계) */}
          {step.isAction && (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onAction}
              className="mt-6 sm:mt-10 px-8 py-4 sm:px-14 sm:py-6 bg-amber-400 text-[#1B4332] font-black text-sm sm:text-base rounded-2xl sm:rounded-[24px] shadow-2xl flex items-center justify-center gap-3 sm:gap-4 transition-all"
            >
              지금 시작하기
              <ArrowRight size={24} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TimelineSteps({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleAction = () => {
    if (isAuthenticated) {
      // PRO 또는 PREMIUM 사용자가 아니면 결제 페이지로 이동
      if (user?.role === 'PRO' || user?.role === 'PREMIUM') {
        navigate('/mypage');
      } else {
        navigate('/premium');
      }
    } else {
      // 로그인이 되어 있지 않으면 로그인 모달 표시
      openAuth('login');
    }
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const scrollScale = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const pathLength = useTransform(scrollScale, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative max-w-6xl mx-auto py-12 md:py-24 px-6 md:px-12">
      {/* ── 타임라인 수직 라인 (Gauge Bar Style) ── */}
      <div className="absolute left-8 md:left-12 top-[120px] bottom-[120px] w-[2px] -translate-x-1/2 hidden md:block group/timeline">
        {/* 전체 트랙 (연한 회색) */}
        <div className="absolute inset-0 bg-gray-100 rounded-full" />

        {/* 진행 게이지 (색상) */}
        <motion.div
          className="absolute inset-0 bg-[#1B4332] origin-top rounded-full"
          style={{ scaleY: pathLength }}
        />

        {/* 시작 도트 (Track Start) */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-gray-100 ring-2 ring-white z-10" />

        {/* 끝 도트 (Track End) */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-gray-100 ring-2 ring-white z-10" />

        {/* 움직이는 헤드 도트 (Gauge Head) */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#1B4332] border-[3px] border-white shadow-lg z-30"
          style={{
            top: useTransform(scrollScale, [0, 1], ['0%', '100%']),
            translateY: '-50%',
          }}
        />
      </div>

      <div className="relative flex flex-col gap-12 md:gap-20">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className="relative pl-0 md:pl-24 lg:pl-40 flex items-center justify-center md:justify-start"
          >
            <SpotlightCard
              step={step}
              index={i}
              onAction={step.isAction ? handleAction : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
