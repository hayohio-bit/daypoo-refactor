import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { FluidFlow } from '../FluidFlow';
import { FramerSlideInButton } from '../FramerSlideInButton';
import { Mouse } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
  openAuth: (mode: 'login' | 'signup') => void;
}

export function HeroOption2({ onCtaClick }: HeroProps) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  const words = "건강한 하루, 당신의 흔적에서 시작됩니다.".split(" ");

  return (
    <section ref={containerRef} className="relative min-h-[120vh] bg-black overflow-hidden select-none">
      {/* Dynamic Background */}
      <motion.div style={{ scale: bgScale }} className="absolute inset-0 z-0">
        <FluidFlow />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
      </motion.div>

      {/* Masked Text Content */}
      <motion.div 
        style={{ y: textY, opacity: textOpacity }}
        className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 z-10"
      >
        <div className="max-w-7xl w-full text-center space-y-12">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ filter: "blur(20px)", opacity: 0, scale: 1.5 }}
                animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 1, 
                  delay: i * 0.15,
                  ease: [0.19, 1, 0.22, 1] 
                }}
                className="text-6xl md:text-[140px] font-black text-white tracking-tighter leading-none mix-blend-difference"
              >
                {word}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="text-xl md:text-3xl text-emerald-300 font-light tracking-wide max-w-3xl mx-auto"
          >
            AI가 분석하는 당신의 매일, 기록하는 즐거움을 경험하세요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, type: "spring" }}
            className="flex justify-center gap-6"
          >
            <FramerSlideInButton onClick={onCtaClick} primary className="px-10 py-5 text-lg">
              지금 시작하기
            </FramerSlideInButton>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-white/30"
        >
          <Mouse size={32} strokeWidth={1} />
          <span className="text-[10px] uppercase tracking-widest font-bold">스크롤하여 이동</span>
        </motion.div>
      </motion.div>

      {/* Bottom Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
    </section>
  );
}
