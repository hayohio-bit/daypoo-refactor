import { motion, useInView } from 'framer-motion';
import { ArrowRight, Brain, MapPin, Sparkles, Zap } from 'lucide-react';
import { useRef } from 'react';

interface Step {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
  color: string;
  isAction?: boolean;
}

const STEPS: Step[] = [
  {
    icon: <MapPin size={28} />,
    step: '01',
    title: '가까운 화장실 찾기',
    desc: '전국 5만 개 공용 화장실 데이터를 언제 어디서나 실시간으로 확인하세요.',
    color: '#2D6A4F',
  },
  {
    icon: <Zap size={28} />,
    step: '02',
    title: '다녀와서 인증하기',
    desc: '브리스톨 척도로 30초 만에 기록하고 나만의 분석 데이터를 쌓아보세요.',
    color: '#E8A838',
  },
  {
    icon: <Brain size={28} />,
    step: '03',
    title: 'AI 장 컨디션 분석 받기',
    desc: '축적된 데이터를 기반으로 장 상태를 과학적으로 분석해 드립니다.',
    color: '#52b788',
  },
  {
    icon: <Sparkles size={28} />,
    step: '04',
    title: '나만의 리포트 완성',
    desc: '오늘 첫 기록을 남기고, 맞춤형 AI 쾌변 가이드를 바로 확인해보세요.',
    color: '#1B4332',
    isAction: true,
  },
];

export function StepCardStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto py-20 px-4">
      <div className="flex flex-col gap-6 items-center">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -160, rotate: -2, scale: 0.95 }}
            animate={
              inView
                ? {
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                  }
                : {}
            }
            transition={{
              duration: 2.8,
              delay: i * 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={
              !step.isAction
                ? {
                    scale: 1.02,
                    y: -8,
                    transition: { duration: 0.3 },
                  }
                : {}
            }
            className="w-full relative group"
            style={{ zIndex: STEPS.length - i }}
          >
            {/* 카드 본체 (High-end Glassmorphism) */}
            <div
              className={`relative rounded-[40px] p-8 md:p-12 border transition-all duration-700 overflow-hidden ${
                step.isAction
                  ? 'flex flex-col items-center text-center gap-6 shadow-[0_40px_100px_rgba(27,67,50,0.2)]'
                  : 'flex items-center gap-8 shadow-[0_25px_50px_-12px rgba(0,0,0,0.05)]'
              }`}
              style={{
                background: step.isAction
                  ? 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)'
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderColor: step.isAction ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              {/* 배경 장식 (Glow) */}
              {!step.isAction && (
                <div
                  className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
                  style={{ backgroundColor: step.color }}
                />
              )}

              {/* 아이콘 섹션 */}
              <div
                className={`rounded-3xl flex items-center justify-center shrink-0 shadow-lg relative ${
                  step.isAction
                    ? 'w-20 h-20 bg-white/10 text-white'
                    : 'w-16 h-16 md:w-20 md:h-20 bg-white'
                }`}
                style={{
                  border: step.isAction
                    ? '1px solid rgba(255,255,255,0.2)'
                    : `1.2px solid ${step.color}20`,
                }}
              >
                <div
                  className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${
                    step.isAction ? 'bg-amber-400 text-[#1B4332]' : 'text-white'
                  }`}
                  style={{ backgroundColor: step.isAction ? undefined : step.color }}
                >
                  {step.step}
                </div>
                <div style={{ color: step.isAction ? '#fff' : step.color }}>{step.icon}</div>
              </div>

              {/* 정보 섹션 */}
              <div className={step.isAction ? 'w-full' : 'flex-1'}>
                <h3
                  className={`text-xl md:text-2xl font-black mb-2 tracking-tight ${step.isAction ? 'text-white' : 'text-[#1B4332]'}`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm md:text-base font-medium leading-relaxed ${step.isAction ? 'text-white/60' : 'text-rgba(27, 67, 50, 0.6)'}`}
                >
                  {step.desc}
                </p>
              </div>

              {/* 액션 버튼 (Action Card 전용) */}
              {step.isAction && (
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#fff' }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 px-10 py-4 bg-amber-400 text-[#1B4332] font-black rounded-full shadow-xl flex items-center gap-3 transition-colors"
                >
                  <ArrowRight size={20} />
                  지금 첫 기록 시작하기
                </motion.button>
              )}

              {/* 화살표 가이드 (Side Hover 시 노출) */}
              {!step.isAction && (
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                  style={{ color: step.color }}
                >
                  <div className="text-2xl">→</div>
                </motion.div>
              )}
            </div>

            {/* 카드 사이 연결 효과 (선) */}
            {i < STEPS.length - 1 && (
              <motion.div
                initial={{ height: 0 }}
                animate={inView ? { height: 24 } : {}}
                transition={{ delay: i * 0.4 + 1, duration: 0.8 }}
                className="mx-auto w-[2px] opacity-10"
                style={{
                  backgroundColor: step.color,
                  backgroundImage: `linear-gradient(to bottom, ${STEPS[i].color}, ${STEPS[i + 1].color})`,
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
