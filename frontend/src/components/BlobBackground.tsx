import { motion } from 'framer-motion';

const BLOBS = [
  {
    id: 1,
    color: 'rgba(45,106,79,0.75)',
    size: 600,
    style: { top: '-150px', left: '-150px' }, // 좌측 맨 위
    dur: 12,
    borderRadius: [
      '24% 76% 35% 65% / 46% 31% 69% 54%',
      '62% 38% 70% 30% / 32% 64% 36% 68%',
      '37% 63% 25% 75% / 78% 39% 61% 22%',
      '24% 76% 35% 65% / 46% 31% 69% 54%',
    ],
  },
  {
    id: 2,
    color: 'rgba(232,168,56,0.22)',
    size: 550,
    style: { bottom: '-150px', right: '-150px' }, // 우측 맨 아래
    dur: 15,
    borderRadius: [
      '65% 35% 20% 80% / 40% 75% 25% 60%',
      '25% 75% 65% 35% / 60% 20% 80% 40%',
      '75% 25% 45% 55% / 35% 85% 15% 65%',
      '65% 35% 20% 80% / 40% 75% 25% 60%',
    ],
  },
];

export function BlobBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {BLOBS.map(blob => (
        <motion.div
          key={blob.id}
          style={{
            position: 'absolute',
            width: blob.size,
            height: blob.size,
            background: blob.color,
            // blur 없음
            ...blob.style,
          }}
          animate={{
            borderRadius: blob.borderRadius,
            rotate: [0, 45, -20, 0], // 회전 폭을 조금 더 키워 불규칙성 강조
            scale: [1, 1.15, 0.85, 1], // 스케일 변화도 더 찌그러지는 느낌으로 강화
          }}
          transition={{
            duration: blob.dur,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}