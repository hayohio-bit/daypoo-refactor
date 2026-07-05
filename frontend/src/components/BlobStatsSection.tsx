import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { MapPin, Brain, Star } from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────────────────────
interface StatConfig {
  target: number;
  format: (v: number) => string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

// ── 데이터 ────────────────────────────────────────────────────────────
const STATS: StatConfig[] = [
  {
    target: 72000,
    format: (v) => v >= 1000 ? `${Math.round(v / 1000)}천+` : `${v}`,
    label: '전국 화장실 지도',
    desc: '공공데이터 기반\n실시간 위치 정보',
    icon: <MapPin size={22} />,
    color: '#E8A838',
  },
  {
    target: 31400,
    format: (v) => v >= 1000 ? `${((v / 1000) / 10).toFixed(1)}만+` : `${v}`,
    label: '누적 건강 데이터',
    desc: 'AI 분석을 위한 거대 데이터셋',
    icon: <Brain size={22} />,
    color: '#52b788',
  },
  {
    target: 89,
    format: (v) => `${v}%`,
    label: '사용자 만족도',
    desc: '실제 이용자들의 생생한 리뷰',
    icon: <Star size={22} />,
    color: '#2D6A4F',
  },
];

// ── 카운트업 Hook ─────────────────────────────────────────────────────
function useCountUp(
  target: number,
  format: (v: number) => string,
  inView: boolean,
  delay = 0
) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 45, damping: 18 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => motionVal.set(target), delay);
    return () => clearTimeout(t);
  }, [inView, motionVal, target, delay]);

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(format(Math.round(v))));
  }, [spring, format]);

  return display;
}

// ── 플로팅 글래스 필러 카드 ──────────────────────────────────────────────
function GlassPillarCard({ 
  stat, inView, delay, isCenter = false 
}: { 
  stat: StatConfig, inView: boolean, delay: number, isCenter?: boolean
}) {
  const display = useCountUp(stat.target, stat.format, inView, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: -80 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 2.2, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -15, scale: 1.02 }}
      className={`relative flex flex-col items-center group cursor-default w-full ${isCenter ? 'max-w-[310px]' : 'max-w-[270px]'}`}
      style={{ zIndex: isCenter ? 20 : 10 }}
    >
      {/* 카드 본체 (Glassmorphism) */}
      <div className="relative w-full rounded-[48px] overflow-hidden p-8 md:p-10 flex flex-col items-center text-center transition-all duration-700"
        style={{ 
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(255, 255, 255, 0.3)',
          boxShadow: isCenter 
            ? '0 30px 60px rgba(0,0,0,0.06), inset 0 0 20px rgba(255,255,255,0.2)' 
            : '0 20px 40px rgba(0,0,0,0.04)',
          height: 'auto',
          minHeight: isCenter ? '380px' : '340px',
        }}
      >
        {/* 내부 글로우 (Hover 시 활성화) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at center, ${stat.color}15 0%, transparent 80%)`,
          }}
        />

        {/* 아이콘 서클 */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8 relative"
          style={{ 
            background: '#fff', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: `1px solid ${stat.color}20`
          }}>
          <div className="absolute inset-0 rounded-full opacity-10 bg-[#1B4332]" />
          <div style={{ color: stat.color }}>{stat.icon}</div>
        </div>

        {/* 텍스트 영역 */}
        <div className="flex-1 flex flex-col justify-center">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-[#1B4332]">
            {stat.label}
          </h4>
          <span className="font-black tracking-[-0.05em] block leading-none text-[#1B4332] mb-4"
            style={{ fontSize: isCenter ? '64px' : '52px' }}>
            {display}
          </span>
          <p className="text-sm font-bold text-[#1B4332] leading-relaxed max-w-[180px] whitespace-pre-line">
            {stat.desc}
          </p>
        </div>

        {/* 하단 데코선 */}
        <div className="w-12 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-8" />
      </div>

      {/* 바닥 그림자 (Shadow reflecting distance) */}
      <div className="mt-8 transition-all duration-500 group-hover:scale-110 group-hover:opacity-40"
        style={{
          width: '60%',
          height: '10px',
          background: 'rgba(0,0,0,0.05)',
          filter: 'blur(12px)',
          borderRadius: '50%',
        }}
      />
    </motion.div>
  );
}

// ── 메인 export (Floating Glass Pillars) ──────────────────────────────
export function BlobStatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative pt-12 pb-24 px-12 overflow-hidden">
      {/* 백그라운드 메쉬 그라데이션 */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(82,183,136,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,168,56,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          <GlassPillarCard stat={STATS[1]} inView={inView} delay={200} />
          <GlassPillarCard stat={STATS[0]} inView={inView} delay={0} isCenter />
          <GlassPillarCard stat={STATS[2]} inView={inView} delay={400} />
        </div>
      </div>
    </section>
  );
}