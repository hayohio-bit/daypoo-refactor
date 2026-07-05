import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTransitionContext } from '../context/TransitionContext';
import { BlobBackground } from '../components/BlobBackground';
import { CustomCursor } from '../components/CustomCursor';
import { FramerSlideInButton } from '../components/FramerSlideInButton';

const containerVariants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -80,
    transition: { duration: 0.6, ease: 'easeInOut' as const },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function SplashPage() {
  const { transitionTo, phase } = useTransitionContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const mouseX = useMotionValue(
    typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  );
  const mouseY = useMotionValue(
    typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  );

  const handleStart = () => {
    transitionTo('/main');
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#152e22', cursor: 'none' }}
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
    >
      <CustomCursor />
      <BlobBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center text-white">
        <AnimatePresence>
          {phase === 'idle' && isReady && (
            <motion.div
              className="relative z-10 flex max-w-5xl flex-col items-center px-6 text-center"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.div variants={fadeUp} className="flex justify-center">
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                >
                  <motion.h1
                    className="text-[56px] sm:text-[80px] leading-none text-white drop-shadow-sm md:text-[144px]"
                    style={{
                      fontFamily: 'SchoolSafetyNotification, system-ui',
                      fontWeight: 700,
                    }}
                  >
                    <span>Day</span>
                    <motion.span
                      className="mx-0.5 inline-block text-[#E8A838]"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.4,
                        type: 'spring',
                        stiffness: 700,
                        damping: 18,
                      }}
                    >
                      .
                    </motion.span>
                    <span>Poo</span>
                  </motion.h1>
                </motion.div>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-4 text-lg sm:text-xl md:text-2xl text-white/70"
              >
                당신의 흔적이 건강이 됩니다
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-6 flex items-center justify-center gap-4 text-base md:text-lg text-white/50"
              >
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span>GUT · HABIT · WELLNESS</span>
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 text-white">
                <FramerSlideInButton onClick={handleStart} primary className="px-16 py-5 text-lg md:text-xl">
                  시작하기
                </FramerSlideInButton>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-5 text-[15px] md:text-base text-white/40"
              >
                계정이 없어도 괜찮아요
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light" />
      </div>
    </div>
  );
}
