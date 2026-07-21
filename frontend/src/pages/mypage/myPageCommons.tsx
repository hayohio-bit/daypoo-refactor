import { motion } from 'framer-motion';
import type { UserResponse } from '../../types/api';

export type TabKey = 'home' | 'collection' | 'report' | 'settings';

export interface AvatarItem {
  id: string;
  emoji: string;
  name: string;
  type: '헤드' | '이펙트' | '마커';
  rawType?: string; // AVATAR, EFFECT 등
  imageUrl?: string;
  owned: boolean;
  price?: number;
  discountPrice?: number | null;
  inventoryId?: string;
  isEquipped?: boolean;
}

export const DEFAULT_AVATAR_URL = '/assets/default-avatar.svg';

export const EFFECT_AURA_COLORS: Record<string, string> = {
  '✨': 'rgba(250, 204, 21, 0.4)',
  '🌟': 'rgba(234, 179, 8, 0.45)',
  '💫': 'rgba(168, 85, 247, 0.4)',
  '🔥': 'rgba(239, 68, 68, 0.45)',
  '❄️': 'rgba(96, 165, 250, 0.4)',
  '🌊': 'rgba(34, 211, 238, 0.4)',
  '🧻': 'rgba(209, 213, 219, 0.35)',
  '💥': 'rgba(249, 115, 22, 0.45)',
};

export function AvatarEffect({ emoji, size = 110 }: { emoji: string; size?: number }) {
  const particles = Array.from({ length: 6 }, (_, i) => i);
  const auraColor = EFFECT_AURA_COLORS[emoji] || 'rgba(250, 204, 21, 0.4)';
  const auraSize = size + 28;

  return (
    <div className="absolute inset-0 pointer-events-none z-20" style={{ overflow: 'visible' }}>
      {/* 오라 글로우 링 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: auraSize,
          height: auraSize,
          left: '50%',
          top: '50%',
          marginLeft: -auraSize / 2,
          marginTop: -auraSize / 2,
          background: `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      {/* 외곽 펄스 링 */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          width: auraSize + 8,
          height: auraSize + 8,
          left: '50%',
          top: '50%',
          marginLeft: -(auraSize + 8) / 2,
          marginTop: -(auraSize + 8) / 2,
          borderColor: auraColor,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      {/* 이모지 파티클 */}
      {particles.map((i) => {
        const angle = (i / 6) * 360;
        const delay = i * 0.4;
        const duration = 2.5 + Math.random();
        const radius = size / 2 + 18;
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-10px',
              marginTop: '-10px',
              fontSize: '14px',
            }}
            animate={{
              x: [
                0,
                Math.cos((angle * Math.PI) / 180) * (radius - 8),
                Math.cos((angle * Math.PI) / 180) * radius,
              ],
              y: [
                0,
                Math.sin((angle * Math.PI) / 180) * (radius - 8),
                Math.sin((angle * Math.PI) / 180) * radius,
              ],
              opacity: [0, 1, 0],
              scale: [0.3, 1, 0.4],
            }}
            transition={{
              duration,
              delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
}
export default AvatarEffect;
