import { motion } from 'framer-motion';
import { useState } from 'react';

interface EmergencyButtonProps {
  onClick: () => void;
}

/**
 * 🍮 Living Coral Liquid Effect Component
 * 우리 서비스의 코랄 팔레트를 기반으로 한 유기적 생명체 효과
 */
const SquishyClayEffect = ({ isHovered }: { isHovered: boolean }) => {
  // 평상시: 정원형에 가까운 은은한 코랄 찹쌀떡
  const baseRadius = [
    '50% 50% 50% 50% / 50% 50% 50% 50%',
    '48% 52% 49% 51% / 51% 49% 52% 48%',
    '50% 50% 50% 50% / 50% 50% 50% 50%',
  ];

  // 호버 시: 코랄 심비오트 변이 (역동적 형태 변화)
  const symbioteRadius = [
    '30% 70% 70% 30% / 30% 30% 70% 70%',
    '60% 40% 30% 70% / 60% 30% 70% 40%',
    '40% 60% 60% 40% / 40% 60% 40% 60%',
    '70% 30% 40% 60% / 30% 70% 30% 70%',
    '30% 70% 70% 30% / 30% 30% 70% 70%',
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* 1. 코랄 유기적 바디 (색상 일원화) */}
      <motion.div
        animate={{
          borderRadius: isHovered ? symbioteRadius : baseRadius,
          scale: isHovered ? [1, 1.2, 0.9, 1.15, 1] : [1, 1.02, 1],
          backgroundColor: isHovered ? '#E85D5D' : '#FF7F7F', // 호버 시 강렬한 레드-코랄, 평상시 선명한 소프트 코랄
        }}
        transition={{
          borderRadius: { duration: isHovered ? 0.7 : 6, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: isHovered ? 1.2 : 6, repeat: Infinity, ease: 'easeInOut' },
          backgroundColor: { duration: 0.3 },
        }}
        className="absolute inset-0 shadow-2xl"
        style={{
          boxShadow: isHovered
            ? '0 20px 40px rgba(232,93,93,0.5), inset -2px -2px 6px rgba(0,0,0,0.2), inset 2px 2px 6px rgba(255,255,255,0.15)'
            : '0 10px 25px rgba(232,93,93,0.2), inset -2px -2px 5px rgba(0,0,0,0.15), inset 2px 2px 5px rgba(255,255,255,0.1)',
        }}
      >
        {/* 내부 디테일 (단색 느낌을 위해 투명도와 블러 대폭 축소) */}
        <motion.div
          animate={{
            scale: isHovered ? [1.1, 0.8, 1.2, 1] : [0.98, 1.02, 0.98],
            opacity: isHovered ? [0.4, 0.7, 0.4] : [0.15, 0.25, 0.15],
          }}
          transition={{ duration: isHovered ? 1.5 : 8, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-6 rounded-full blur-md ${isHovered ? 'bg-white/30' : 'bg-white/10'}`}
        />
      </motion.div>

      {/* 4. 코랄 심비오트 촉수 분출 (Hover 시) */}
      {isHovered && (
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.6, 2, 0.6],
                x: [0, Math.cos((i * 60 * Math.PI) / 180) * 60],
                y: [0, Math.sin((i * 60 * Math.PI) / 180) * 60],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.12, ease: 'anticipate' }}
              className="absolute w-5 h-5 bg-[#E85D5D] blur-[2px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function EmergencyButton({ onClick }: EmergencyButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[900] group">
      <motion.button
        animate={{
          y: hovered ? [0, -4, 4, 0] : [0, -10, 0],
          rotate: hovered ? [-1, 1, -1, 1, 0] : 0,
        }}
        transition={{
          duration: hovered ? 0.3 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.82 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={onClick}
        aria-label="긴급 화장실 찾기"
        className="relative flex flex-col items-center justify-center w-[98px] h-[98px] md:w-[110px] md:h-[110px]"
        style={{
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        {/* 🌋 코랄 찹쌀떡 -> 심비오트 배경 */}
        <SquishyClayEffect isHovered={hovered} />

        {/* 아이콘 및 텍스트 레이어 */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <motion.div
            animate={
              hovered
                ? {
                    scale: [1, 1.4, 0.8, 1.2, 1],
                    rotate: [0, -15, 15, -10, 0],
                    filter: 'brightness(1.1) drop-shadow(0 0 10px rgba(255,255,255,0.7))',
                  }
                : { scale: 1, rotate: 0, filter: 'none' }
            }
            transition={{
              duration: 0.6,
              repeat: Infinity,
            }}
            className="mb-1 text-4xl select-none"
            aria-hidden="true"
          >
            🚨
          </motion.div>
          <span className="text-[15.5px] font-[1000] tracking-tighter drop-shadow-lg select-none text-white">
            급똥
          </span>
        </div>

        {/* 바닥 글로우 */}
        <div
          className={`absolute inset-[-35%] blur-[60px] -z-10 transition-all duration-1000 rounded-full ${hovered ? 'bg-[#E85D5D]/25' : 'bg-[#FDA4AF]/15'}`}
        />
      </motion.button>
    </div>
  );
}
