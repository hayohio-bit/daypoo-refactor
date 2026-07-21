import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ── 타입 ──────────────────────────────────────────────────────────────

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** hover 시 나타나는 glowBox의 색상 (rgba 추천) */
  glowColor?: string;
  onClick?: () => void;
  /** hover 시 위로 떠오르는 Y 오프셋 (기본 -4px) */
  hoverLift?: number;
  /** 초기 진입 애니메이션 비활성화 */
  noAnimation?: boolean;
  /** 카드 패딩 (기본 p-6) */
  padding?: string;
  style?: React.CSSProperties;
  /** HTML role attribute (기본 없음, 클릭 가능한 카드면 'button' 권장) */
  role?: string;
  'aria-label'?: string;
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────

/**
 * 프로젝트 전반에 사용되는 glassmorphism 스타일 카드.
 * AdminPage, MyPage, RankingPage 등에 산재하던 인라인 스타일을 통합.
 *
 * @example
 * <GlassCard glowColor="rgba(27,67,50,0.1)" onClick={handleClick}>
 *   <p>내용</p>
 * </GlassCard>
 */
export function GlassCard({
  children,
  className = '',
  glowColor = 'rgba(27,67,50,0.08)',
  onClick,
  hoverLift = -4,
  noAnimation = false,
  padding = 'p-6',
  style,
  role,
  'aria-label': ariaLabel,
}: GlassCardProps) {
  return (
    <motion.div
      initial={noAnimation ? undefined : { opacity: 0, y: 20 }}
      animate={noAnimation ? undefined : { opacity: 1, y: 0 }}
      whileHover={
        onClick
          ? {
              y: hoverLift,
              boxShadow: `0 20px 40px ${glowColor}`,
            }
          : { y: hoverLift }
      }
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      className={`relative overflow-hidden rounded-[24px] ${padding} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(26,43,39,0.08)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
