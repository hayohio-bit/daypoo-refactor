import { motion } from 'framer-motion';
import { useState } from 'react';

// ── 타입 ──────────────────────────────────────────────────────────────

interface KnockoutWobbleProps {
  text: string;
  gradient?: string;
  fontSize?: string;
  fontWeight?: number;
  wobbleDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────

/**
 * hover 시 개별 글자가 흔들리는 스프링(Wobble) 애니메이션 텍스트 컴포넌트.
 * 마이페이지의 닉네임 및 타이틀에 사용됩니다.
 */
export function KnockoutWobble({
  text,
  gradient = 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 45%, #E8A838 100%)',
  fontSize = 'clamp(22px, 5vw, 36px)',
  fontWeight = 900,
  wobbleDuration = 480,
  className = '',
  style,
}: KnockoutWobbleProps) {
  const [wobbling, setWobbling] = useState<Set<number>>(new Set());

  const trigger = (i: number) => {
    setWobbling((p) => new Set(p).add(i));
    setTimeout(() => {
      setWobbling((p) => {
        const n = new Set(p);
        n.delete(i);
        return n;
      });
    }, wobbleDuration);
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontWeight,
        fontSize,
        letterSpacing: '-0.04em',
        lineHeight: 1.05,
        ...style,
      }}
    >
      {text.split('').map((char, i) =>
        char === ' ' ? (
          <span key={i} style={{ width: '0.28em' }} />
        ) : (
          <motion.span
            key={i}
            onHoverStart={() => trigger(i)}
            animate={
              wobbling.has(i)
                ? {
                    rotate: [0, -14, 14, -8, 8, -3, 3, 0],
                    y: [0, -7, 3, -3, 2, 0],
                    scale: [1, 1.2, 0.95, 1.08, 0.98, 1],
                  }
                : { rotate: 0, y: 0, scale: 1 }
            }
            transition={{ duration: wobbleDuration / 1000, ease: 'easeOut' }}
            style={{
              display: 'inline-block',
              cursor: 'default',
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {char}
          </motion.span>
        ),
      )}
    </span>
  );
}
export default KnockoutWobble;
