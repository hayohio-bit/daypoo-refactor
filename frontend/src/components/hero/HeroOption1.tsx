import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Activity, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { NovaGlow } from '../NovaGlow';
import WaveButton from '../WaveButton';

interface HeroProps {
  onCtaClick: () => void;
  openAuth: (mode: 'login' | 'signup') => void;
}

export function HeroOption1({ onCtaClick, openAuth }: HeroProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth Spring for mouse movements
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  // Parallax transforms for background and cards
  const bgX = useTransform(smoothX, [-500, 500], [-30, 30]);
  const bgY = useTransform(smoothY, [-500, 500], [-30, 30]);
  const cardX = useTransform(smoothX, [-500, 500], [-15, 15]);
  const cardY = useTransform(smoothY, [-500, 500], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX - innerWidth / 2);
    mouseY.set(clientY - innerHeight / 2);
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#F8FAF9] px-6 py-20"
    >
      {/* Background Layers */}
      <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 scale-150">
          <NovaGlow color="rgba(82, 183, 136, 0.2)" size="600px" />
        </div>
        <div className="absolute bottom-1/4 -right-20 scale-150">
          <NovaGlow color="rgba(45, 106, 79, 0.15)" size="500px" />
        </div>
      </motion.div>

      {/* Glass Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              y: [0, -20, 0],
              rotate: [0, 45, 0],
            }}
            transition={{
              duration: 8 + i,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.5,
            }}
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            className="absolute w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 hidden md:block"
          />
        ))}
      </div>

      {/* Content Layer */}
      <div className="relative z-20 max-w-5xl w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100 mb-4">
            <Sparkles size={16} />
            <span>AI 기반 실시간 배변 분석 서비스</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-[#1A2B27] leading-[1.1] tracking-tighter">
            당신의 흔적이 <br />
            <span className="text-emerald-600 italic">기록이 됩니다.</span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            전국 약 5만 건의 화장실 데이터와 지능형 AI 분석으로 <br className="hidden md:block" />
            당신의 편안한 하루를 완벽하게 서포트합니다.
          </p>
        </motion.div>

        {/* Floating Feature Cards */}
        <motion.div
          style={{ x: cardX, y: cardY }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <FeatureCard
            icon={<MapPin className="text-emerald-500" />}
            title="스마트 화장실 지도"
            desc="전국 위치 기반 정밀 안내"
          />
          <FeatureCard
            icon={<Activity className="text-amber-500" />}
            title="실시간 위생 모니터링"
            desc="사용자 참여형 데이터 서비스"
          />
          <FeatureCard
            icon={<ShieldCheck className="text-blue-500" />}
            title="AI 배변 패턴 분석"
            desc="프라이버시 중심 로컬 연동"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="pt-8"
        >
          <WaveButton onClick={onCtaClick} variant="primary" className="px-12 py-5 text-xl">
            가까운 화장실 찾기
          </WaveButton>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="p-6 rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/40 shadow-xl shadow-emerald-900/5 text-left space-y-3"
    >
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-[#1A2B27]">{title}</h4>
        <p className="text-xs text-slate-500 leading-snug">{desc}</p>
      </div>
    </motion.div>
  );
}
