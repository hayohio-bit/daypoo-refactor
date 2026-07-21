import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Star } from 'lucide-react';
import { useState } from 'react';

// ── 타입 ──────────────────────────────────────────────────────────────

export interface DeckCard {
  id: string;
  emoji: string;
  label: string;
  sublabel?: React.ReactNode;
  accent?: string;
  selected?: boolean;
  locked?: boolean;
}

interface DepthDeckProps {
  cards: DeckCard[];
  onSelect?: (id: string) => void;
  cardWidth?: number;
  cardHeight?: number;
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────

/**
 * 3D Coverflow 스타일의 덱 캐러셀 컴포넌트.
 * 마이페이지의 컬렉션 및 아바타 선택 영역에서 입체감 있는 카드 슬라이드를 제공합니다.
 */
export function DepthDeckCarousel({
  cards,
  onSelect,
  cardWidth = 160,
  cardHeight = 200,
}: DepthDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const n = cards.length;
  if (n === 0) return null;

  const goTo = (idx: number) => {
    const clamped = ((idx % n) + n) % n;
    setActiveIndex(clamped);
    onSelect?.(cards[clamped].id);
  };

  const getCardStyle = (i: number) => {
    let diff = i - activeIndex;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;

    const absDiff = Math.abs(diff);
    const sign = Math.sign(diff);

    // 보이는 카드 범위 제한 (앞뒤 최대 2개)
    if (absDiff > 2) return null;

    const SPREAD = cardWidth * 0.72; // 카드 간 가로 간격
    const ROTATION = 42; // Y축 회전각
    const DEPTH = 180; // Z축 깊이감

    const x = diff * SPREAD;
    const rotateY = -sign * Math.min(absDiff, 1) * ROTATION;
    const z = -absDiff * DEPTH;
    const scale = absDiff === 0 ? 1 : absDiff === 1 ? 0.82 : 0.68;
    const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.75 : 0.45;
    const zIndex = 10 - absDiff;

    return { x, rotateY, z, scale, opacity, zIndex, isCenter: absDiff === 0 };
  };

  const handleDragEnd = (_e: any, info: { offset: { x: number } }) => {
    setDragging(false);
    if (info.offset.x < -50) goTo(activeIndex + 1);
    else if (info.offset.x > 50) goTo(activeIndex - 1);
  };

  return (
    <div className="flex flex-col items-center gap-5 select-none w-full">
      {/* 카드 스테이지 */}
      <div
        style={{
          width: '100%',
          height: cardHeight + 32,
          position: 'relative',
          perspective: '900px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cards.map((card, i) => {
          const s = getCardStyle(i);
          if (!s) return null;

          return (
            <motion.div
              key={card.id}
              onClick={() => !dragging && goTo(i)}
              animate={{
                x: s.x,
                rotateY: s.rotateY,
                z: s.z,
                scale: s.scale,
                opacity: s.opacity,
              }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.9,
              }}
              whileHover={
                s.isCenter ? { scale: 1.04, y: -6 } : { scale: s.scale * 1.04, y: -3 }
              }
              drag={s.isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setDragging(true)}
              onDragEnd={handleDragEnd}
              style={{
                position: 'absolute',
                width: cardWidth,
                height: cardHeight,
                zIndex: s.zIndex,
                cursor: s.isCenter ? 'grab' : 'pointer',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 카드 본체 */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  background: card.selected ? '#fffbef' : '#ffffff',
                  border: card.selected
                    ? '2px solid rgba(232,168,56,0.6)'
                    : s.isCenter
                    ? '1.5px solid rgba(26,43,39,0.12)'
                    : '1px solid rgba(26,43,39,0.07)',
                  boxShadow: s.isCenter
                    ? '0 20px 48px rgba(26,43,39,0.12), 0 4px 16px rgba(26,43,39,0.06)'
                    : '0 8px 24px rgba(26,43,39,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '20px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background .2s, border .2s',
                }}
              >
                {s.isCenter && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: card.selected
                        ? 'radial-gradient(circle at 50% 30%, rgba(232,168,56,0.08) 0%, transparent 70%)'
                        : 'radial-gradient(circle at 50% 30%, rgba(27,67,50,0.05) 0%, transparent 70%)',
                      borderRadius: '24px',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {card.locked && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(248,250,249,0.65)',
                      backdropFilter: 'blur(2px)',
                      borderRadius: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <Lock size={20} style={{ color: 'rgba(26,43,39,0.25)' }} />
                  </div>
                )}

                {card.selected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#E8A838',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      zIndex: 3,
                    }}
                  >
                    <Star size={11} fill="#fff" color="#fff" />
                  </div>
                )}

                <span
                  style={{
                    fontSize: s.isCenter ? '44px' : '36px',
                    lineHeight: 1,
                    transition: 'font-size .3s',
                    filter: card.locked ? 'grayscale(1) opacity(0.4)' : 'none',
                  }}
                >
                  {card.emoji}
                </span>

                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <p
                    style={{
                      fontSize: s.isCenter ? '14px' : '12px',
                      fontWeight: 800,
                      color: '#1A2B27',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                      transition: 'font-size .3s',
                    }}
                  >
                    {card.label}
                  </p>
                  {card.sublabel && (
                    <div
                      style={{
                        fontSize: s.isCenter ? '12px' : '10px',
                        fontWeight: 600,
                        color: card.accent || '#52b788',
                        marginTop: '4px',
                        opacity: 0.9,
                      }}
                    >
                      {card.sublabel}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 조작 네비게이션 */}
      <div className="flex items-center gap-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => goTo(activeIndex - 1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#fff',
            border: '1px solid rgba(26,43,39,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(26,43,39,0.08)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1B4332"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>

        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/[0.03] border border-black/5">
          <span className="text-sm font-black text-[#1B4332]">{activeIndex + 1}</span>
          <div className="w-[1px] h-3 bg-black/10" />
          <span className="text-xs font-bold text-black/30">{cards.length}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => goTo(activeIndex + 1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#fff',
            border: '1px solid rgba(26,43,39,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(26,43,39,0.08)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1B4332"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
export default DepthDeckCarousel;
