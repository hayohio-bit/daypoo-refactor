import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ── 타입 ──────────────────────────────────────────────────────────────

interface CountUpProps {
  /** 최종 도달할 숫자 */
  target: number;
  /** 숫자 뒤에 붙을 접미사 (예: '명', '원') */
  suffix?: string;
  /** 애니메이션 지속 시간 (ms, 기본 1500ms) */
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────

/**
 * 화면에 노출되는 시점(Viewport)에 작동하는 카운트업 텍스트 컴포넌트.
 * MyPage 및 AdminPage 통계 등에서 공통으로 사용됩니다.
 */
export function CountUp({
  target,
  suffix = '',
  duration = 1500,
  className = '',
  style,
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;

    let active = true;
    const startTime = performance.now();

    const updateCount = (now: number) => {
      if (!active) return;

      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out expo curve 적용
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);

    return () => {
      active = false;
    };
  }, [inView, target, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
export default CountUp;
