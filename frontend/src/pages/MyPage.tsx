import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  generateProfileAvatar,
  generateItemAvatar,
  parseDicebearUrl,
  isEmoji,
} from '../utils/avatar';
import { Navbar } from '../components/Navbar';
import {
  ShoppingBag,
  Package,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Settings,
  ChevronRight,
  Lock,
  Check,
  X,
  Sparkles,
  Trophy,
  Calendar,
  BarChart3,
  LogOut,
  Trash2,
  Crown,
  Brain,
  ArrowRight,
  Activity,
  CheckCircle2,
  Cloud,
  Waves,
  Droplets,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MyPageSkeleton } from '../components/LoadingSkeleton';
import WaveButtonComponent from '../components/WaveButton';
import { UserResponse, HealthRecordRequest } from '../types/api';
import { HealthLogModal, HealthLogResult } from '../components/map/HealthLogModal';

// ── 타입 ──────────────────────────────────────────────────────────────
type TabKey = 'home' | 'collection' | 'report' | 'settings';

interface AvatarItem {
  id: string;
  emoji: string;
  name: string;
  type: '헤드' | '이펙트' | '마커';
  rawType?: string; // 원본 타입 (AVATAR, EFFECT 등)
  imageUrl?: string; // DiceBear 또는 URL 이미지
  owned: boolean;
  price?: number;
  discountPrice?: number | null; // 할인가 (추가)
  inventoryId?: string; // 인벤토리 ID (장착/해제 API 호출 시 필요)
  isEquipped?: boolean; // 장착 여부
}

const DEFAULT_AVATAR_URL = '/assets/default-avatar.svg';

// ── 공통 헬퍼 함수 ───────────────────────────────────────────────────────

// [CLEANUP] 하드코딩된 FALLBACK 데이터와 BRISTOL_DATA는 백엔드 연동이 완료되었으므로 제거합니다.

// ── 카운트업 ──────────────────────────────────────────────────────────
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const startTime = performance.now();
    const update = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  },
});
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// ══════════════════════════════════════════════════════════════════════
// ① KNOCKOUT WOBBLE TEXT
//    background-clip:text 마스킹 + 글자별 spring wobble
// ══════════════════════════════════════════════════════════════════════
interface KnockoutWobbleProps {
  text: string;
  gradient?: string;
  fontSize?: string;
  fontWeight?: number;
  wobbleDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

function KnockoutWobble({
  text,
  gradient = 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 45%, #E8A838 100%)',
  fontSize = 'clamp(22px, 5vw, 36px)',
  fontWeight = 900,
  wobbleDuration = 480,
  className,
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

// ══════════════════════════════════════════════════════════════════════
// ② ARC GALLERY 3D
//    Canvas rAF 루프, 수학적 arc bend, 드래그 + 스냅
// ══════════════════════════════════════════════════════════════════════
// ② DEPTH DECK CAROUSEL (Coverflow 3D)
//    DepthDeck Framer 컴포넌트 포팅 — framer-motion rotateY + z + scale
//    중앙 카드 정면, 양쪽 카드 Y축 회전 + 뒤로 밀림, 클릭 시 앞으로
// ══════════════════════════════════════════════════════════════════════
interface DeckCard {
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

function DepthDeckCarousel({ cards, onSelect, cardWidth = 160, cardHeight = 200 }: DepthDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const n = cards.length;

  const goTo = (idx: number) => {
    const clamped = ((idx % n) + n) % n;
    setActiveIndex(clamped);
    onSelect?.(cards[clamped].id);
  };

  const getCardStyle = (i: number) => {
    // 중앙 기준 상대 거리 (-n/2 ~ n/2)
    let diff = i - activeIndex;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;

    const absDiff = Math.abs(diff);
    const sign = Math.sign(diff);

    // 보이는 카드 범위 제한
    if (absDiff > 2) return null;

    const SPREAD = cardWidth * 0.72; // 카드 간 가로 간격
    const ROTATION = 42; // 양쪽 카드 Y축 회전각
    const DEPTH = 180; // translateZ 깊이감

    const x = diff * SPREAD;
    const rotateY = -sign * Math.min(absDiff, 1) * ROTATION;
    const z = -absDiff * DEPTH;
    const scale = absDiff === 0 ? 1 : absDiff === 1 ? 0.82 : 0.68;
    const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.75 : 0.45;
    const zIndex = 10 - absDiff;

    return { x, rotateY, z, scale, opacity, zIndex, isCenter: absDiff === 0 };
  };

  // 드래그 처리
  const handleDragEnd = (_e: any, info: { offset: { x: number } }) => {
    setDragging(false);
    if (info.offset.x < -50) goTo(activeIndex + 1);
    else if (info.offset.x > 50) goTo(activeIndex - 1);
  };

  return (
    <div className="flex flex-col items-center gap-5 select-none">
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
              whileHover={s.isCenter ? { scale: 1.04, y: -6 } : { scale: s.scale * 1.04, y: -3 }}
              drag={s.isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => {
                setDragging(true);
              }}
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
                {/* 중앙 카드 배경 글로우 */}
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

                {/* 잠금 오버레이 */}
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

                {/* 선택 뱃지 */}
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

                {/* 이모지 */}
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

                {/* 라벨 */}
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
                    <p
                      style={{
                        fontSize: s.isCenter ? '12px' : '10px',
                        fontWeight: 600,
                        color: card.accent || '#52b788',
                        marginTop: '4px',
                        opacity: 0.9,
                      }}
                    >
                      {card.sublabel}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 네비게이션 화살표 + 인디케이터 */}
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

        {/* 숫자 인디케이터 (과도한 점 방지) */}
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

// ── 히어로 배너 ───────────────────────────────────────────────────────
const EFFECT_AURA_COLORS: Record<string, string> = {
  '✨': 'rgba(250, 204, 21, 0.4)',
  '🌟': 'rgba(234, 179, 8, 0.45)',
  '💫': 'rgba(168, 85, 247, 0.4)',
  '🔥': 'rgba(239, 68, 68, 0.45)',
  '❄️': 'rgba(96, 165, 250, 0.4)',
  '🌊': 'rgba(34, 211, 238, 0.4)',
  '🧻': 'rgba(209, 213, 219, 0.35)',
  '💥': 'rgba(249, 115, 22, 0.45)',
};

function AvatarEffect({ emoji, size = 110 }: { emoji: string; size?: number }) {
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
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
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
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
              repeat: Infinity,
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

function HeroBanner({
  equippedItem,
  equippedEffect,
  onAvatarClick,
  user,
  records = [],
}: {
  equippedItem: AvatarItem | null;
  equippedEffect: AvatarItem | null;
  onAvatarClick: () => void;
  user: UserResponse | null;
  records?: any[];
}) {
  return (
    <div className="relative overflow-hidden" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
          style={{
            top: '-10%',
            left: '20%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(82,183,136,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-6 pt-24 sm:pt-40 pb-8 sm:pb-12">
        <div className="flex items-end justify-between gap-3 sm:gap-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex items-end gap-3 sm:gap-6 min-w-0"
          >
            {/* 아바타 */}
            <motion.div variants={fadeUp(0)} className="relative flex-shrink-0">
              {equippedEffect?.emoji && <AvatarEffect emoji={equippedEffect.emoji} />}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAvatarClick}
                className="relative group"
              >
                <div
                  className="relative z-10 flex items-center justify-center rounded-[36px] transition-all duration-300 group-hover:shadow-2xl overflow-hidden"
                  style={{
                    width: 'min(110px, 22vw)',
                    height: 'min(110px, 22vw)',
                    background: '#ffffff',
                    border: '2px solid rgba(26,43,39,0.08)',
                    fontSize: 'min(56px, 12vw)',
                    boxShadow: '0 16px 48px rgba(27,67,50,0.12)',
                  }}
                >
                  {equippedItem?.id ? (
                    equippedItem.imageUrl &&
                    (isEmoji(equippedItem.imageUrl) ||
                      (!equippedItem.imageUrl.includes(':') &&
                        !equippedItem.imageUrl.startsWith('http') &&
                        !equippedItem.imageUrl.startsWith('/'))) ? (
                      <span className="text-5xl select-none leading-none">
                        {equippedItem.imageUrl}
                      </span>
                    ) : (
                      <img
                        src={parseDicebearUrl(
                          equippedItem.imageUrl,
                          equippedItem.id,
                          equippedItem.rawType || 'AVATAR',
                        )}
                        alt={equippedItem.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : user?.id ? (
                    <img
                      src={generateProfileAvatar(user.id, user.equippedAvatarUrl)}
                      alt={user.nickname || '프로필'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '💩'
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 z-20 flex items-center justify-center rounded-xl font-black text-xs shadow-lg"
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)',
                    color: '#1B4332',
                    border: '4px solid #ffffff',
                  }}
                >
                  {user?.level || 1}
                </div>
                <div
                  className="absolute inset-0 -z-10 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity"
                  style={{ background: 'radial-gradient(circle, #E8A838 0%, transparent 70%)' }}
                />
              </motion.button>
            </motion.div>

            {/* 텍스트 영역 */}
            <div className="pb-1">
              <motion.div variants={fadeUp(0.05)}>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2"
                  style={{
                    background: 'rgba(232,168,56,0.12)',
                    color: '#E8A838',
                    border: '1px solid rgba(232,168,56,0.2)',
                  }}
                >
                  <Trophy size={9} />{' '}
                  {user?.equippedTitleName && user.equippedTitleName !== '새내기 쾌변러'
                    ? user.equippedTitleName
                    : '보유 칭호 없음'}
                </span>
              </motion.div>

              {/* ★ Knockout Wobble 닉네임 */}
              <motion.div variants={fadeUp(0.1)} className="mb-1">
                <KnockoutWobble
                  text={user?.nickname || '익명의 쾌변러'}
                  gradient="#1B4332"
                  fontSize="clamp(22px, 5vw, 36px)"
                  fontWeight={900}
                  wobbleDuration={500}
                />
              </motion.div>

              <motion.div variants={fadeUp(0.15)} className="flex items-center gap-3 mt-3">
                {(() => {
                  const level = user?.level || 1;
                  const currentExp = user?.exp || 0;
                  const expForNextLevel = level * 100; // 레벨당 100 경험치 필요
                  const expPercent = Math.min((currentExp / expForNextLevel) * 100, 100);

                  return (
                    <>
                      <div
                        className="relative overflow-hidden rounded-full"
                        style={{
                          width: 'min(160px, 30vw)',
                          height: '6px',
                          background: 'rgba(26,43,39,0.08)',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${expPercent}%` }}
                          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: '#E8A838' }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'rgba(26,43,39,0.4)' }}>
                        Lv.{level} · {Math.round(expPercent)}%
                      </span>
                    </>
                  );
                })()}
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="hidden sm:flex flex-col gap-2 pb-1"
          >
            {(() => {
              // 통계 계산
              const totalAuthCount = user?.totalAuthCount || records.length;
              const totalVisitCount =
                user?.totalVisitCount || new Set(records.map((r: any) => r.toiletId)).size;

              // 연속 기록 계산
              let consecutiveDays = user?.consecutiveDays || 0;
              if (records.length > 0 && !user?.consecutiveDays) {
                const sortedRecords = [...records].sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                );
                let streak = 1;
                let lastDate = new Date(sortedRecords[0].createdAt);
                lastDate.setHours(0, 0, 0, 0);

                for (let i = 1; i < sortedRecords.length; i++) {
                  const currentDate = new Date(sortedRecords[i].createdAt);
                  currentDate.setHours(0, 0, 0, 0);
                  const diffDays = Math.floor(
                    (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
                  );

                  if (diffDays === 1) {
                    streak++;
                    lastDate = currentDate;
                  } else if (diffDays > 1) {
                    break;
                  }
                }
                consecutiveDays = streak;
              }

              return [
                { label: '총 인증', value: totalAuthCount, suffix: '회', color: '#E8A838' },
                { label: '방문 화장실', value: totalVisitCount, suffix: '곳', color: '#52b788' },
                { label: '연속 기록', value: consecutiveDays, suffix: '일', color: '#52b788' },
              ];
            })().map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp(i * 0.06)}
                className="flex items-center gap-2"
              >
                <span className="text-xs" style={{ color: 'rgba(26,43,39,0.35)' }}>
                  {s.label}
                </span>
                <span
                  className="font-black text-sm"
                  style={{ color: s.color, letterSpacing: '-0.03em' }}
                >
                  <CountUp target={s.value} suffix={s.suffix} />
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '100%', lineHeight: 0 }}>
        <svg
          viewBox="0 0 1440 40"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%' }}
        >
          <path
            d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z"
            fill="#f8faf9"
          />
        </svg>
      </div>
    </div>
  );
}

// ── 탭 바 ─────────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: '홈', icon: <Sparkles size={22} /> },
  { key: 'collection', label: '컬렉션', icon: <Trophy size={22} /> },
  { key: 'report', label: '리포트', icon: <BarChart3 size={22} /> },
  { key: 'settings', label: '설정', icon: <Settings size={22} /> },
];

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div
      className="flex gap-2 sm:gap-4 px-3 sm:px-10 py-3 sm:py-5 mx-auto overflow-x-auto scrollbar-hide"
      style={{
        maxWidth: '896px',
        background: 'transparent',
        borderBottom: '1px solid rgba(26,43,39,0.05)',
      }}
    >
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className="relative flex-1 flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-4 rounded-[18px] sm:rounded-[24px] text-sm sm:text-base font-black transition-all whitespace-nowrap min-w-0"
          style={{ color: active === t.key ? '#E8A838' : 'rgba(26,43,39,0.35)' }}
        >
          {active === t.key && (
            <motion.div
              layoutId="tabHighlight"
              className="absolute inset-0 rounded-[22px]"
              style={{
                background: 'rgba(232,168,56,0.1)',
                border: '1px solid rgba(232,168,56,0.2)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2.5">
            {t.icon}
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function NicknameSetupBanner({ onSettingsClick }: { onSettingsClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 sm:mx-10 mb-8 p-5 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
          <Sparkles size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-black text-amber-900 leading-tight">
            아아, 쾌변러님! 잠시만요!
          </p>
          <p className="text-xs sm:text-sm font-bold text-amber-700/80 mt-1 truncate">
            나만의 닉네임을 설정하면 랭킹에서 더욱 빛날 수 있어요.
          </p>
        </div>
      </div>
      <button
        onClick={onSettingsClick}
        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-black rounded-2xl transition-all shadow-md shadow-amber-200 flex-shrink-0"
      >
        설정하러 가기
      </button>
    </motion.div>
  );
}

// ── 홈 탭 ─────────────────────────────────────────────────────────────
function HomeTab({
  equipped,
  setEquipped,
  user,
  avatarItems,
  setAvatarItems,
  initialShopTab = 'inventory',
  refreshUser,
  fetchShopData,
  onTabChange,
  records = [],
}: {
  equipped: AvatarItem | null;
  setEquipped: (i: AvatarItem) => void;
  user: UserResponse | null;
  avatarItems: AvatarItem[];
  setAvatarItems: React.Dispatch<React.SetStateAction<AvatarItem[]>>;
  initialShopTab?: 'inventory' | 'shop';
  refreshUser: () => Promise<void>;
  fetchShopData: () => Promise<void>;
  onTabChange?: (k: TabKey) => void;
  records?: any[];
}) {
  const [shopTab, setShopTab] = useState<'inventory' | 'shop'>(initialShopTab);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'AVATAR' | 'EFFECT'>('all');
  const [preview, setPreview] = useState<AvatarItem | null>(null);
  const [saved, setSaved] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const items = (() => {
    const base =
      shopTab === 'inventory'
        ? (avatarItems || [])
            .filter((i) => i.owned)
            .sort((a, b) => {
              if (a.isEquipped && !b.isEquipped) return -1;
              if (!a.isEquipped && b.isEquipped) return 1;
              return 0;
            })
        : (avatarItems || []).filter((i) => !i.owned);
    if (categoryFilter === 'all') return base;
    return base.filter((i) => i.rawType === categoryFilter);
  })();

  // DepthDeck 카드 데이터 변환
  const deckCards: DeckCard[] = items.map((item) => ({
    id: item.id,
    emoji: item.emoji,
    label: item.name,
    sublabel: item.owned ? (
      equipped?.id === item.id || preview?.id === item.id ? (
        '착용 중'
      ) : (
        item.type
      )
    ) : item.discountPrice != null ? (
      <div className="flex items-center justify-center gap-1.5 leading-none">
        <span className="line-through opacity-30 text-[10px] scale-90">
          {item.price?.toLocaleString()}P
        </span>
        <span className="font-black" style={{ color: '#E85D5D' }}>
          {item.discountPrice.toLocaleString()}P
        </span>
      </div>
    ) : (
      `${item.price?.toLocaleString()}P`
    ),
    accent: item.owned ? '#2D6A4F' : '#E8A838',
    selected: preview?.id === item.id || (!preview && equipped?.id === item.id),
  }));

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number | ''>(5000);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 15;

  // shopTab 또는 카테고리 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(0);
  }, [shopTab, categoryFilter]);

  // 토스 페이먼츠 결제창 호출
  const handleTossPayment = async () => {
    if (chargeAmount === '' || chargeAmount < 100) {
      alert('충전 금액은 100원 이상이어야 합니다.');
      return;
    }
    try {
      const tossPayments = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY);
      await tossPayments.requestPayment('카드', {
        amount: chargeAmount,
        orderId: `POOPMAP_${Math.random().toString(36).substring(2, 11)}`,
        orderName: `포인트 ${chargeAmount.toLocaleString()}P 충전`,
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/mypage',
      });
    } catch (err: any) {
      console.error('결제 요청 실패:', err);
      // 토스 페이먼츠의 다양한 취소 에러 코드 및 메시지 대응 (PAY_PROCESS_CANCELED, USER_CANCEL 등)
      const isCancellation =
        err?.code?.includes('CANCELED') ||
        err?.errorCode?.includes('CANCELED') ||
        err?.message?.includes('취소') ||
        err?.message?.toLowerCase().includes('cancel') ||
        String(err).includes('CANCELED');

      if (isCancellation) {
        if (confirm('결제를 취소하시겠습니까?')) {
          setShowPaymentModal(false);
        }
        return;
      }
      alert('결제창을 띄우는 중 오류가 발생했습니다.');
      setShowPaymentModal(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    if (preview.owned) {
      // 이미 소유한 아이템 → 장착 API 호출
      if (!preview.inventoryId) {
        alert('아이템 정보가 올바르지 않습니다.');
        return;
      }

      try {
        await api.post(`/shop/inventory/${preview.inventoryId}/toggle`);

        // AVATAR 타입이면 프로필 아바타 즉시 반영
        if (preview.rawType === 'AVATAR') {
          setEquipped(preview);
        }

        // 서버 데이터 다시 가져오기 (isEquipped 상태 동기화)
        fetchShopData();

        // 유저 정보 전역 상태 다시 가져오기 (상단 아바타 캐시/상태 갱신)
        refreshUser();

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setPreview(null);
      } catch (err: any) {
        console.error('아이템 장착 실패:', err);
        alert(err.message || '아이템 장착에 실패했습니다.');
      }
    } else {
      // 미소유 아이템 → 구매 시도
      const userPoints = user?.points ?? 0;
      const itemPrice = preview.discountPrice ?? preview.price ?? 0;

      if (userPoints >= itemPrice) {
        // 포인트 충분 → 구매 API 호출
        try {
          await api.post('/shop/purchase', { itemId: preview.id });

          // 사용자 정보 새로고침 (포인트 업데이트)
          await refreshUser();

          // 아이템 목록 새로고침 (owned 상태 및 inventoryId 업데이트)
          await fetchShopData();

          // 구매한 아이템 찾기 (새로 생성된 inventoryId 포함)
          const response = await api.get<any[]>('/shop/inventory');
          const newInventoryItem = Array.isArray(response)
            ? response.find((inv) => String(inv.itemId) === preview.id)
            : null;

          if (newInventoryItem?.id) {
            // 자동 장착 API 호출
            await api.post(`/shop/inventory/${newInventoryItem.id}/toggle`);

            // 최종 동기화
            await fetchShopData();

            alert('아이템을 구매하고 장착했습니다!');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            setPreview(null);
          } else {
            alert('아이템을 구매했지만 장착에 실패했습니다. 인벤토리에서 직접 장착해주세요.');
            setPreview(null);
          }
        } catch (err: any) {
          console.error('아이템 구매 실패:', err);
          alert(err.message || '아이템 구매에 실패했습니다.');
        }
      } else {
        // 포인트 부족 → 충전 모달 표시
        setShowPaymentModal(true);
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8"
    >
      {/* ★ 아바타 커스터마이징 섹션 (심리스 듀얼 패널 대시보드) */}
      <motion.div
        variants={fadeUp(0)}
        className="bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px]"
      >
        {/* 인벤토리 메인 영역 */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-10 pt-6 sm:pt-10 pb-4 sm:pb-8">
            <div>
              <p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Avatar Customizing
              </p>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xl sm:text-3xl font-black text-[#1A2B27] tracking-tight">
                  {shopTab === 'inventory' ? '보유 아이템' : '프리미엄 상점'}
                </span>
                {shopTab === 'shop' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-black shadow-inner"
                    style={{
                      background: 'rgba(232,168,56,0.1)',
                      color: '#E8A838',
                      border: '1.5px solid rgba(232,168,56,0.15)',
                    }}
                  >
                    <Sparkles size={16} /> {(user?.points ?? 0).toLocaleString()}P
                  </motion.span>
                )}
              </div>
            </div>
            <div className="flex rounded-[16px] sm:rounded-[24px] p-1.5 sm:p-2 bg-gray-50 border border-gray-100 shadow-sm">
              {(['inventory', 'shop'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setShopTab(t);
                    setPreview(null);
                  }}
                  className="relative px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-[12px] sm:rounded-[18px] text-sm sm:text-base font-black transition-all"
                  style={{ color: shopTab === t ? '#ffffff' : 'rgba(26,43,39,0.4)' }}
                >
                  {shopTab === t && (
                    <motion.div
                      layoutId="shopTab"
                      className="absolute inset-0 rounded-[18px]"
                      style={{ background: '#1B4332' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    {t === 'inventory' ? (
                      <>
                        <Package size={20} /> 인벤토리
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={20} /> 상점
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 sm:px-6 pb-4 sm:pb-6">
            {/* 카테고리 필터 (전체 / 아바타 / 오라효과) */}
            <div className="flex gap-2 mb-4">
              {[
                { key: 'all' as const, label: '전체' },
                { key: 'AVATAR' as const, label: '아바타' },
                { key: 'EFFECT' as const, label: '오라효과' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                    categoryFilter === cat.key
                      ? 'bg-[#1B4332] text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${shopTab}-${categoryFilter}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {items.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {items
                      .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                      .map((item, idx) => {
                        const avatarType = item.rawType || 'AVATAR';
                        const isSelected = preview?.id === item.id;
                        const isOwned = item.owned;
                        const color = isOwned ? '#2D6A4F' : '#E8A838';

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => setPreview(item)}
                            className={`group cursor-pointer rounded-[24px] border-2 transition-all overflow-hidden ${
                              isSelected
                                ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20'
                                : 'border-gray-100 hover:border-emerald-200 hover:shadow-xl'
                            } ${
                              idx === (Math.min(items.length, (currentPage + 1) * itemsPerPage) - (currentPage * itemsPerPage)) - 1 && 
                              (Math.min(items.length, (currentPage + 1) * itemsPerPage) - (currentPage * itemsPerPage)) % 2 !== 0 
                                ? 'col-span-2 sm:col-span-1' 
                                : ''
                            }`}
                            style={{ background: '#fff' }}
                          >
                            <div className="aspect-square bg-black/[0.02] flex items-center justify-center relative overflow-hidden p-4">
                              <div
                                className="w-12 h-12 rounded-full blur-2xl opacity-20 absolute"
                                style={{ background: color }}
                              />
                              {item.imageUrl && (isEmoji(item.imageUrl) || (!item.imageUrl.includes(':') && !item.imageUrl.startsWith('http') && !item.imageUrl.startsWith('/'))) ? (
                                <span className="text-6xl transition-transform group-hover:scale-110 duration-500 select-none leading-none">
                                  {item.imageUrl}
                                </span>
                              ) : (
                                <img
                                  src={parseDicebearUrl(item.imageUrl, item.id, avatarType)}
                                  alt={item.name}
                                  className="w-full h-full object-contain transition-transform group-hover:scale-110 duration-500"
                                />
                              )}
                              {isOwned && (
                                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                                  <Check size={14} strokeWidth={3} />
                                </div>
                              )}
                              </div>
                              <div className="p-3 border-t border-gray-100">
                                <h5 className="font-black text-sm mb-1 text-black truncate">
                                  {item.name}
                                </h5>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                                    {item.type}
                                  </span>
                                  <span className="font-black text-sm" style={{ color }}>
                                    {item.isEquipped ? (
                                      <span className="flex items-center gap-1 text-emerald-600">
                                        <CheckCircle2 size={12} strokeWidth={3} />
                                        장착중
                                      </span>
                                    ) : isOwned ? (
                                      '보유중'
                                    ) : item.discountPrice != null ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="text-[10px] line-through text-gray-300">
                                          {item.price?.toLocaleString()}P
                                        </span>
                                        <span className="text-red-500">
                                          {item.discountPrice.toLocaleString()}P
                                        </span>
                                      </span>
                                    ) : (
                                      `${item.price?.toLocaleString()}P`
                                    )}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>

                    {/* 페이징 */}
                    {Math.ceil(items.length / itemsPerPage) > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                          className="px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          이전
                        </button>
                        <span className="text-sm font-bold text-gray-400 px-4">
                          {currentPage + 1} / {Math.ceil(items.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPage(
                              Math.min(Math.ceil(items.length / itemsPerPage) - 1, currentPage + 1),
                            )
                          }
                          disabled={currentPage >= Math.ceil(items.length / itemsPerPage) - 1}
                          className="px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-52 text-lg font-bold text-gray-300">
                    {shopTab === 'inventory'
                      ? '보유한 아이템이 없어요'
                      : '판매 중인 아이템이 없어요'}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-sm font-semibold text-gray-300 py-4 italic tracking-wide">
          클릭하거나 드래그해서 아바타를 꾸며보세요
        </p>
      </motion.div>

      {/* 전역 플로팅 인텔리전트 바 (데스크톱 & 모바일 통합 UX) */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[500px]"
          >
            <div
              className="flex items-center gap-5 p-4 rounded-[32px] border border-white/40 shadow-[0_30px_90px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
              style={{ background: 'rgba(255,255,255,0.92)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex-shrink-0 relative overflow-hidden group flex items-center justify-center">
                {preview.imageUrl &&
                (isEmoji(preview.imageUrl) ||
                  (!preview.imageUrl.includes(':') &&
                    !preview.imageUrl.startsWith('http') &&
                    !preview.imageUrl.startsWith('/'))) ? (
                  <span className="text-3xl select-none leading-none">{preview.imageUrl}</span>
                ) : (
                  <img
                    src={parseDicebearUrl(
                      preview.imageUrl,
                      preview.id,
                      preview.rawType || 'AVATAR',
                    )}
                    className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110"
                    alt={preview.name}
                  />
                )}
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    {preview.type}
                  </span>
                </div>
                <h4 className="text-base font-black text-[#1A2B27] truncate">{preview.name}</h4>
                <p className="text-[10px] font-bold text-gray-400">
                  {preview.owned ? (
                    equipped?.id === preview.id ? (
                      '현재 장착 중'
                    ) : (
                      '보유 중인 아이템'
                    )
                  ) : preview.discountPrice != null ? (
                    <span>
                      <span className="line-through mr-1">{preview.price?.toLocaleString()}P</span>
                      <span className="text-red-500 font-black">
                        {preview.discountPrice.toLocaleString()}P 필요
                      </span>
                    </span>
                  ) : (
                    `${preview.price?.toLocaleString()}P 필요`
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <WaveButtonComponent
                  onClick={handleSave}
                  variant={preview.owned ? 'primary' : 'accent'}
                  size="sm"
                  className="!px-6 !rounded-[20px] !h-11 shadow-lg"
                  icon={saved || preview.owned ? <Check size={18} /> : <ShoppingBag size={18} />}
                >
                  {saved ? '저장됨' : preview.owned ? '장착하기' : '구매하기'}
                </WaveButtonComponent>
                <button
                  onClick={() => setPreview(null)}
                  className="w-11 h-11 flex items-center justify-center rounded-[18px] bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 포인트 충전 모달 (사이즈 업) */}

      {/* 포인트 충전 모달 (사이즈 업) */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-3xl p-6 sm:p-12 text-center border border-white"
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-10 right-10 w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <X size={24} />
              </button>
              <div className="w-24 h-24 bg-amber-100 rounded-[36px] flex items-center justify-center mx-auto mb-8 transform rotate-3 shadow-lg">
                <ShoppingBag size={42} className="text-amber-500" />
              </div>
              <h3 className="text-3xl font-black text-[#1B4332] mb-4 tracking-tight">
                포인트가 부족해요!
              </h3>
              <p className="text-gray-500 font-bold text-lg leading-relaxed mb-6">
                아이템을 구매하기 위한 포인트가 부족합니다.
                <br />
                원하시는 충전 금액을 입력하고 결제를 진행해보세요.
              </p>

              <div className="mb-8 relative max-w-[240px] mx-auto">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={chargeAmount}
                  onChange={(e) =>
                    setChargeAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full text-center text-4xl font-black py-2 border-b-4 border-emerald-500 focus:outline-none focus:border-amber-400 bg-transparent transition-colors text-[#1B4332] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-2 bottom-3 text-xl font-bold text-gray-400">
                  원
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handleTossPayment}
                  className="w-full py-5 bg-[#1B4332] text-white font-black text-xl rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {chargeAmount === '' ? '0' : chargeAmount.toLocaleString()}원 결제하기
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-4 text-gray-400 font-black text-lg hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 컬렉션 탭 ─────────────────────────────────────────────────────────
function CollectionTab({
  titles,
  setTitles,
  onRefresh,
  onRefreshUser,
}: {
  titles: any[];
  setTitles: React.Dispatch<React.SetStateAction<any[]>>;
  onRefresh?: () => void;
  onRefreshUser?: () => Promise<void>;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [saving, setSaving] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<any | null>(null);

  const selectedTitle = titles.find((t) => t.selected);

  const handleEquipTitle = async () => {
    if (!selectedPreview || !selectedPreview.earned) return;

    setSaving(true);
    try {
      await api.post(`/shop/titles/${selectedPreview.id}/equip`);
      setTitles((prev) => prev.map((t) => ({ ...t, selected: t.id === selectedPreview.id })));
      setSelectedPreview(null);
      alert('✅ 칭호가 장착되었습니다!');
      if (onRefreshUser) await onRefreshUser();
    } catch (err: any) {
      console.error('칭호 장착 실패:', err);
      alert('칭호 장착에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnequipTitle = async () => {
    if (!selectedTitle) return;

    if (!confirm('현재 칭호를 해제하시겠습니까?')) return;

    setSaving(true);
    try {
      // 칭호 해제는 백엔드 수정 필요 (현재는 임시로 로컬만 변경)
      setTitles((prev) => prev.map((t) => ({ ...t, selected: false })));
      alert('✅ 칭호가 해제되었습니다!\n\n(백엔드 API 추가 시 서버에 저장됩니다)');
      if (onRefreshUser) await onRefreshUser();
    } catch (err: any) {
      console.error('칭호 해제 실패:', err);
      alert('칭호 해제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const earnedCount = titles.filter((t) => t.earned).length;

  // DepthDeck 카드 변환
  const titleCards: DeckCard[] = titles.map((t) => ({
    id: t.id,
    emoji: t.earned ? (t.selected ? '★' : '✓') : '🔒',
    label: t.label,
    sublabel: t.selected
      ? '닉네임에 장착 중'
      : t.earned
        ? '획득 완료'
        : t.conditionLabel || '비밀 조건',
    accent: t.selected ? '#E8A838' : t.earned ? '#2D6A4F' : 'rgba(26,43,39,0.3)',
    selected: t.selected,
    locked: !t.earned,
  }));

  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8"
    >
      {/* 컬렉션 현황 대시보드 (사이즈 업) */}
      <motion.div
        variants={fadeUp(0)}
        className="rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 bg-white border border-gray-100 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5">
          <Trophy size={180} />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] mb-2.5">
            수집 현황
          </p>
          <h2 className="text-3xl font-black text-[#1A2B27] mb-6 tracking-tighter">
            나의 명예로운 자취
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-6">
            <div className="p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] bg-gray-50 border border-gray-100 shadow-inner">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">
                보유한 칭호
              </p>
              <p className="text-xl sm:text-3xl font-black text-[#1B4332]">
                {earnedCount}{' '}
                <span className="text-sm sm:text-lg text-gray-300">/ {titles.length}</span>
              </p>
            </div>
            <div className="p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] bg-gray-50 border border-gray-100 shadow-inner">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">
                수집 진행률
              </p>
              <p className="text-xl sm:text-3xl font-black text-[#E8A838]">
                {titles.length > 0 ? Math.round((earnedCount / titles.length) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm font-black text-gray-400 px-2">
              <span>컬렉션 달성률</span>
              <span>
                {titles.length > 0 ? Math.round((earnedCount / titles.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner p-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${titles.length > 0 ? (earnedCount / titles.length) * 100 : 0}%`,
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-lg"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ★ DepthDeck 칭호 도감 (사이즈 업) */}
      <motion.div
        variants={fadeUp(0.12)}
        className="rounded-[24px] sm:rounded-[40px] overflow-hidden bg-white border border-gray-100 shadow-sm"
      >
        <div className="px-4 sm:px-10 pt-6 sm:pt-10 pb-4 sm:pb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
              보유 칭호 목록
            </p>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full text-xs font-black text-emerald-600 border border-emerald-100 shadow-sm">
              <Check size={14} /> 수집 정보
            </div>
          </div>
          <p className="text-2xl font-black text-[#1A2B27] tracking-tighter">칭호 컬렉션 도감</p>
        </div>

        {/* 컬렉션 상단 안내 문구 추가 */}
        <div className="flex flex-col items-center justify-center py-2 sm:py-4 gap-2 border-b border-gray-50 mb-4 bg-gray-50/30">
          <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-amber-500 shadow-sm">
            <Trophy size={14} />
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 italic text-center">
            도감의 칭호를 클릭하여 상세 조건과 진행 상황을 확인해보세요!
          </p>
        </div>

        <div className="px-6 pb-6">
          <DepthDeckCarousel
            cards={titleCards}
            onSelect={(id) => {
              const t = titles.find((x) => x.id === id);
              if (t) setSelectedPreview(t);
            }}
            cardWidth={180}
            cardHeight={240}
          />
        </div>

        {/* 칭호 상세 정보 및 진행도 표시 */}
        <div className="px-4 sm:px-10 py-6 sm:py-8 bg-gray-50/50 border-t border-gray-100">
          {selectedPreview ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  칭호 상세 정보
                </div>
                <h4 className="text-2xl font-black text-[#1B4332] mb-2">{selectedPreview.label}</h4>
                <p className="text-sm font-bold text-gray-500 max-w-md mx-auto leading-relaxed">
                  {selectedPreview.description || '이 칭호에 대한 설명이 없습니다.'}
                </p>
              </div>

              {!selectedPreview.earned && (
                <div className="max-w-md mx-auto bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                        획득 필요 조건
                      </p>
                      <p className="text-sm font-black text-gray-700">
                        {selectedPreview.conditionLabel}
                      </p>
                    </div>
                    <p className="text-xs font-black text-gray-300">
                      {selectedPreview.currentProgress || 0} /{' '}
                      {selectedPreview.achievementThreshold}
                    </p>
                  </div>

                  <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (selectedPreview.currentProgress / selectedPreview.achievementThreshold) * 100)}%`,
                      }}
                      className="h-full bg-[#E8A838] rounded-full"
                    />
                  </div>

                  <p className="text-[10px] font-bold text-center text-gray-400 italic">
                    {(() => {
                      const remainVal =
                        selectedPreview.achievementThreshold -
                        (selectedPreview.currentProgress || 0);
                      if (remainVal <= 0)
                        return '축하합니다! 업적을 달성했습니다. 지금 바로 획득하세요!';
                      return `${remainVal}번 더 남았습니다! 힘내세요!`;
                    })()}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                <button
                  onClick={() => setSelectedPreview(null)}
                  className="py-4 px-6 bg-white border border-gray-200 text-gray-400 font-bold rounded-[24px] hover:bg-gray-50 transition-all text-sm"
                >
                  닫기
                </button>
                {selectedPreview.earned ||
                selectedPreview.currentProgress >= selectedPreview.achievementThreshold ? (
                  <button
                    onClick={async () => {
                      if (selectedPreview.earned) {
                        handleEquipTitle();
                      } else {
                        // [Manual Acquisition] 새로 추가된 획득 API 호출
                        setSaving(true);
                        try {
                          await api.post(`/shop/titles/${selectedPreview.id}/acquire`);
                          alert('축하합니다! 칭호를 획득했습니다. ✨');
                          setSelectedPreview(null);
                          // 전체 목록 다시 불러오기
                          if (onRefresh) onRefresh();
                        } catch (e) {
                          alert('칭호 획득에 실패했습니다. 다시 시도해주세요.');
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                    disabled={saving || (selectedPreview.earned && selectedPreview.selected)}
                    className={`py-4 px-6 font-black rounded-[24px] shadow-lg transition-all text-sm ${
                      selectedPreview.selected
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    {saving
                      ? '처리 중...'
                      : selectedPreview.selected
                        ? '장착 중 ★'
                        : selectedPreview.earned
                          ? '칭호 장착 ✨'
                          : '획득하기 🎁'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="py-4 px-6 bg-gray-200 text-gray-400 font-black rounded-[24px] cursor-not-allowed text-sm opacity-50"
                  >
                    미획득 🔒
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-emerald-500 shadow-sm">
                <Sparkles size={20} />
              </div>
              <p className="text-sm font-bold text-emerald-600/60 italic text-center">
                위 도감에서 칭호를 선택하여<br />상세 내용을 확인하세요!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 리포트 탭 ─────────────────────────────────────────────────────────
function ReportTab({
  records = [],
  reportCacheRef,
  onAddRecord,
}: {
  records?: any[];
  reportCacheRef: React.MutableRefObject<Record<string, any>>;
  onAddRecord?: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);

  // 권한 확인 (PRO 또는 PREMIUM 멤버십 확인)
  const isPro = user?.isPro || false;

  // 멤버십 이름 동적 표시
  const membershipName = user?.subscription?.plan || 'PRO';

  const displayData =
    records.length > 0
      ? records.slice(-7).map((r, i) => ({
          day: ['월', '화', '수', '목', '금', '토', '일'][new Date(r.createdAt).getDay()],
          type: r.bristolScale ?? 4,
          emoji: [
            <TrendingUp size={20} />,
            <Activity size={20} />,
            <CheckCircle2 size={20} />,
            <CheckCircle2 size={20} />,
            <Cloud size={20} />,
            <Waves size={20} />,
            <Droplets size={20} />,
          ][(r.bristolScale ?? 4) - 1] || <Activity size={20} />,
          color: (r.bristolScale ?? 4) >= 3 && (r.bristolScale ?? 4) <= 5 ? '#52b788' : '#E8A838',
        }))
      : [];

  const hasData = displayData.length > 0;

  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState<any>(null);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const fetchReport = useCallback(
    async (type: string) => {
      // 탭 전환 시 데이터 초기화 및 로딩 가림 방지
      setReportData(null);

      // 일반회원은 weekly/monthly AI 분석 호출 자체를 막음
      if (!isPro && type !== 'daily') {
        setIsFetchLoading(false);
        return;
      }

      // 이미 불러온 데이터가 있으면 즉시 표시 (DAILY는 항상 새로 요청)
      if (type !== 'daily' && reportCacheRef.current[type]) {
        setReportData(reportCacheRef.current[type]);
        return;
      }

      setIsFetchLoading(true);
      try {
        const res = await api.get(`/reports/${type.toUpperCase()}`);
        reportCacheRef.current[type] = res;
        setReportData(res);
      } catch (err: any) {
        console.error('리포트 조회 실패:', err);
        if (err.message?.includes('포인트')) {
          alert('포인트가 부족하여 리포트를 생성할 수 없습니다. 포인트를 충전해주세요!');
          setActiveSubTab('daily');
        }
      } finally {
        setIsFetchLoading(false);
      }
    },
    [isPro],
  );

  useEffect(() => {
    fetchReport(activeSubTab);
  }, [activeSubTab, fetchReport]);

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8"
    >
      {/* 기록 추가 버튼 */}
      {onAddRecord && (
        <div className="flex justify-end">
          <WaveButtonComponent
            onClick={onAddRecord}
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
          >
            기록 추가하기
          </WaveButtonComponent>
        </div>
      )}

      {/* 서브 탭 내비게이션 (AI 가이드 연동) */}
      <div className="flex p-1.5 sm:p-2 bg-gray-100 rounded-[16px] sm:rounded-[24px] w-full sm:w-fit mx-auto mb-4 mt-3 border border-gray-200 shadow-inner overflow-x-auto scrollbar-hide">
        {[
          { key: 'daily', label: '오늘 가이드', free: true },
          { key: 'weekly', label: '7일 리포트', free: false },
          { key: 'monthly', label: '30일 트렌드', free: false },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key as any)}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-[12px] sm:rounded-[18px] text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 whitespace-nowrap ${
              activeSubTab === t.key
                ? 'bg-white text-[#1B4332] shadow-md border border-gray-100'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
            }`}
          >
            {t.label}
            {!t.free && (
              <Crown
                size={14}
                className={activeSubTab === t.key ? 'text-amber-500' : 'text-gray-300'}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'daily' ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* 정밀 분석 유도 카드 */}
            {!isPro && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate('/premium')}
                className="rounded-[32px] p-6 cursor-pointer overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/30">
                      <BarChart3 className="text-emerald-950" size={24} />
                    </div>
                    <div>
                      <p className="text-white font-black text-base">7일 정밀 분석 리포트 해제</p>
                      <p className="text-emerald-200/60 text-xs font-bold">
                        {membershipName} 멤버십으로 모든 통계를 한눈에 확인하세요
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-emerald-300" size={20} />
                </div>
              </motion.div>
            )}

            <div className="rounded-[24px] sm:rounded-[40px] p-5 sm:p-12 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[24px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner flex-shrink-0">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-[#1A2B27] tracking-tight">
                    오늘의 쾌변 가이드
                  </h3>
                  <p className="text-[10px] sm:text-sm font-black text-gray-400 uppercase tracking-[0.15em] mt-1">
                    Free Analyst • Live Update
                  </p>
                </div>
              </div>

              {isFetchLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">AI 분석 중...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-8">
                    <div className="p-4 sm:p-8 rounded-[20px] sm:rounded-[36px] bg-gray-50 border border-gray-100 shadow-inner">
                      <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2.5">
                        현재 장 상태
                      </p>
                      <p className="text-lg sm:text-2xl font-black text-[#1B4332] flex items-center gap-1.5 sm:gap-2.5">
                        {!hasData
                          ? '분석 데이터 없음'
                          : reportData?.healthScore > 80
                            ? '아주 좋음'
                            : reportData?.healthScore > 60
                              ? '좋음'
                              : '보통'}
                        <Sparkles size={22} className="text-amber-400" />
                      </p>
                    </div>
                    <div className="p-4 sm:p-8 rounded-[20px] sm:rounded-[36px] bg-gray-50 border border-gray-100 shadow-inner">
                      <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2.5">
                        장 컨디션 점수
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-amber-500">
                        {reportData?.healthScore || 0}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-10 rounded-[20px] sm:rounded-[40px] bg-emerald-950 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Sparkles size={60} />
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-black text-emerald-300 mb-2 sm:mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> AI Guide Poo
                      Insight
                    </p>
                    <p className="text-base sm:text-xl font-bold leading-relaxed relative z-10 tracking-tight">
                      "
                      {reportData?.summary || '기록을 분석하고 있습니다. 화장실 기록을 남겨주세요!'}
                      "
                    </p>
                    {reportData?.solution && (
                      <p className="mt-3 sm:mt-4 text-emerald-200 text-sm sm:text-lg italic">
                        💡 {reportData.solution}
                      </p>
                    )}
                    {reportData?.premiumSolution && (
                      <button
                        onClick={() => setShowPremiumModal(true)}
                        className="mt-4 sm:mt-6 w-full py-3 sm:py-4 bg-amber-400 text-emerald-950 font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-all uppercase tracking-widest text-xs sm:text-sm"
                      >
                        <Crown size={18} /> 프리미엄 정밀 분석 보기
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pro-sections"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative min-h-[600px] sm:min-h-[800px]"
          >
            {/* 정밀 분석 UI (비PRO 회원은 블러 처리 및 클릭 방지) */}
            <div
              className={`space-y-6 ${!isPro ? 'blur-[8px] opacity-40 pointer-events-none select-none' : ''}`}
            >
              {isPro && isFetchLoading ? (
                <div className="rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 bg-white border border-gray-100 shadow-sm flex items-center justify-center py-20 sm:py-32">
                  <div className="text-center">
                    <div className="w-20 h-20 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-bold text-lg">AI 정밀 분석 중...</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] sm:rounded-[40px] p-5 sm:p-12 bg-white border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-10">
                    <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                      {activeSubTab === 'weekly'
                        ? '7일 정밀 분석 리포트'
                        : '30일 컨디션 트렌드 리포트'}
                    </h3>
                    <div className="px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 flex items-center gap-2 shadow-sm">
                      <Crown size={14} className="text-amber-500" />
                      <span className="text-xs font-black text-amber-600">
                        {membershipName} MEMBERSHIP
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center mb-8 sm:mb-12">
                    <div className="relative">
                      <svg
                        width="160"
                        height="160"
                        viewBox="0 0 200 200"
                        className="sm:w-[200px] sm:h-[200px]"
                      >
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="16"
                        />
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#E8A838"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 90}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                          animate={{
                            strokeDashoffset:
                              2 * Math.PI * 90 * (1 - (reportData?.healthScore || 0) / 100),
                          }}
                          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                          transform="rotate(-90 100 100)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-5xl font-black text-[#1A2B27] tracking-tighter">
                          {reportData?.healthScore || 0}
                        </span>
                        <span className="text-[12px] font-black text-gray-400 mt-0.5 uppercase tracking-widest">
                          Health Score
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 분석 기간 표시 */}
                  {reportData?.periodStart && reportData?.periodEnd && (
                    <p className="text-sm text-gray-400 text-center mb-6">
                      분석 기간: {new Date(reportData.periodStart).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(reportData.periodEnd).toLocaleDateString('ko-KR')}
                      &nbsp;({reportData.recordCount}건)
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
                    {[
                      {
                        label: '최다 식단',
                        val: reportData?.mostFrequentDiet ?? '-',
                        emoji: <Droplets size={24} className="text-emerald-500" />,
                      },
                      {
                        label: '최다 컨디션',
                        val: reportData?.mostFrequentCondition ?? '-',
                        emoji: <AlertCircle size={24} className="text-red-500" />,
                      },
                      {
                        label: '최다 브리스톨',
                        val:
                          reportData?.mostFrequentBristol != null
                            ? `Step ${reportData.mostFrequentBristol}`
                            : '-',
                        emoji: <Activity size={24} className="text-blue-500" />,
                      },
                      {
                        label: '쾌변 비율',
                        val: reportData?.healthyRatio != null ? `${reportData.healthyRatio}%` : '-',
                        emoji: <Trophy size={24} className="text-amber-500" />,
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center p-3 sm:p-6 rounded-[20px] sm:rounded-[32px] bg-gray-50 border border-gray-50 shadow-inner group hover:bg-white hover:shadow-xl transition-all"
                      >
                        <span className="text-[#1A2B27] mb-3 transform group-hover:scale-110 transition-transform">
                          {stat.emoji}
                        </span>
                        <span className="text-[10px] font-black text-gray-300 mb-1 uppercase tracking-tighter text-center">
                          {stat.label}
                        </span>
                        <span className="text-sm font-black text-[#1A2B27]">{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 sm:p-8 rounded-[20px] sm:rounded-[40px] bg-emerald-50 border border-emerald-100 shadow-inner">
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <Brain size={18} className="text-emerald-700" />
                        <p className="text-sm sm:text-lg font-black text-emerald-800">
                          심층 분석 데이터 인사이트
                        </p>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        {(reportData?.insights || []).map((insight: string, i: number) => (
                          <p
                            key={i}
                            className="text-sm sm:text-base text-emerald-900/70 font-bold leading-relaxed flex items-start gap-2"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            {insight}
                          </p>
                        ))}
                      </div>
                      {reportData?.solution && (
                        <div className="mt-6 pt-6 border-t border-emerald-100">
                          <p className="text-emerald-700 text-sm sm:text-lg italic font-bold">
                            💡 {reportData.solution}
                          </p>
                        </div>
                      )}
                      {reportData?.premiumSolution && (
                        <button
                          onClick={() => setShowPremiumModal(true)}
                          className="mt-5 sm:mt-8 w-full py-4 sm:py-5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black rounded-[20px] sm:rounded-[24px] flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 hover:-translate-y-1 transition-all uppercase tracking-[0.15em] text-xs sm:text-sm"
                        >
                          <Crown size={20} /> 프리미엄 정밀 분석 보기
                        </button>
                      )}
                    </div>
                  </div>

                  {/* MONTHLY 전용 추가 트렌드 섹션 (데이터가 있을 때만 혹은 블러 처리용) */}
                  {(activeSubTab === 'monthly' || !isPro) && (
                    <div className="mt-5 sm:mt-8 p-4 sm:p-8 rounded-[20px] sm:rounded-[40px] bg-gray-50 border border-gray-100 shadow-inner">
                      <div className="flex items-center justify-between mb-5 sm:mb-8">
                        <h4 className="text-base sm:text-lg font-black text-[#1A2B27]">
                          30일 심층 트렌드
                        </h4>
                        <div className="flex items-center gap-2">
                          {reportData?.improvementTrend === 'IMPROVING' ? (
                            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black flex items-center gap-1">
                              <TrendingUp size={14} /> 개선 중
                            </span>
                          ) : reportData?.improvementTrend === 'DECLINING' ? (
                            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-600 text-xs font-black flex items-center gap-1">
                              <TrendingDown size={14} /> 주의 필요
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-black flex items-center gap-1">
                              <Minus size={14} /> 안정적
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 주차별 점수 차트 */}
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                            주차별 장 컨디션 점수 추이
                          </p>
                          <div className="flex items-end justify-between h-40 px-4 border-b border-gray-200 pb-2 gap-4 overflow-visible">
                            {(reportData?.weeklyHealthScores || [0, 0, 0, 0]).map(
                              (score: number, i: number) => (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center justify-end gap-2 h-full"
                                >
                                  {score > 0 && (
                                    <motion.span
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-[10px] font-black text-emerald-600 mb-1"
                                    >
                                      {score}
                                    </motion.span>
                                  )}
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(score, 4)}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="w-8 rounded-t-lg shadow-sm"
                                    style={{ backgroundColor: '#52b788' }}
                                  />
                                  <span className="text-[10px] font-bold text-gray-400 mt-1">
                                    {i + 1}주
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        {/* 브리스톨 분포 */}
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                            브리스톨 척도 분포
                          </p>
                          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                            {Object.entries(reportData?.bristolDistribution || {}).map(
                              ([key, val]: [string, any]) => {
                                const k = parseInt(key);
                                const total = Object.values(
                                  reportData?.bristolDistribution || {},
                                ).reduce((a: any, b: any) => a + b, 0) as number;
                                const percentage = (val / (total || 1)) * 100;
                                const isHealthy = k === 3 || k === 4;
                                return (
                                  <div
                                    key={key}
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: isHealthy ? '#52b788' : '#e9c46a',
                                    }}
                                    title={`Step ${key}: ${val}회`}
                                    className="h-full border-r border-white last:border-0"
                                  />
                                );
                              },
                            )}
                          </div>
                          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                            <span>변비/정상</span>
                            <span>설사/묽은변</span>
                          </div>
                          <p className="mt-4 text-sm font-black text-[#1A2B27]">
                            일평균 배변:{' '}
                            <span className="text-emerald-600">
                              {reportData?.avgDailyRecordCount || 0}회
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 잠금 오버레이 (비PRO 회원 전용) */}
            {!isPro && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md bg-white/95 backdrop-blur-xl p-5 sm:p-14 rounded-[32px] sm:rounded-[56px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-white text-center"
                >
                  <motion.div
                    className="w-12 h-12 sm:w-20 sm:h-20 bg-amber-100 rounded-[20px] sm:rounded-[32px] flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-inner"
                    animate={{ rotate: [0, -15, 15, -10, 10, -5, 5, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: 'easeInOut',
                    }}
                  >
                    <Lock size={24} className="text-amber-500 sm:w-9 sm:h-9" />
                  </motion.div>
                  <h3 className="text-lg sm:text-2xl font-black text-[#1A2B27] mb-1 sm:mb-3 tracking-tight">
                    정밀 분석 리포트 잠금
                  </h3>
                  <p className="text-gray-500 font-bold text-xs sm:text-base mb-5 sm:mb-10 leading-relaxed">
                    {activeSubTab === 'weekly' ? '7일간의' : '30일간의'} 누적 기록을 바탕으로 산출되는 <br />
                    <span className="text-emerald-700">장 컨디션 점수</span>와{' '}
                    <span className="text-emerald-700">AI 푸의 맞춤 가이드</span>는<br />
                    <span className="text-[#1B4332] font-black">
                      {activeSubTab === 'weekly' ? 'PRO' : 'PREMIUM'} 멤버십
                    </span>{' '}
                    회원에게만 제공됩니다.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/premium')}
                    className="w-full py-3.5 sm:py-6 bg-[#1B4332] text-white font-black rounded-[18px] sm:rounded-[28px] shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg"
                  >
                    {activeSubTab === 'weekly' ? 'PRO' : 'PREMIUM'} 멤버십 가입하고 확인하기{' '}
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 진단서 모달 (PRO 전용이나 기존 로직 유지용) */}
      <AnimatePresence>
        {reportOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportOpen(false)}
              className="fixed inset-0 z-[200]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
              style={{
                width: 'min(520px, calc(100vw - 32px))',
                maxHeight: 'calc(100dvh - 48px)',
                background: '#ffffff',
                borderRadius: '28px',
                border: '1px solid rgba(26,43,39,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(26,43,39,0.3)' }}
                    >
                      주간 진단서
                    </span>
                    <KnockoutWobble
                      text="데이푸의 주간 리포트"
                      gradient="linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #E8A838 100%)"
                      fontSize="18px"
                      fontWeight={900}
                      wobbleDuration={400}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setReportOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ background: 'rgba(26,43,39,0.06)', color: 'rgba(26,43,39,0.4)' }}
                  >
                    <X size={15} />
                  </motion.button>
                </div>
                {/* 비PRO 회원이면 여기서도 안내 가능하지만 일단은 기본 형태 */}
                {!isPro ? (
                  <div className="text-center py-10">
                    <Lock size={40} className="mx-auto text-amber-500 mb-4" />
                    <p className="font-black text-[#1A2B27] mb-2">PRO 전용 정밀 리포트입니다</p>
                    <p className="text-sm text-gray-500 mb-6">
                      멤버십을 구독하고 전체 내용을 확인하세요.
                    </p>
                    <button
                      onClick={() => navigate('/premium')}
                      className="px-6 py-3 bg-[#1B4332] text-white rounded-xl font-bold"
                    >
                      PRO 가입하기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="rgba(26,43,39,0.06)"
                            strokeWidth="8"
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#E8A838"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 50 * 0.15 }}
                            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span
                            className="font-black text-3xl"
                            style={{ color: '#E8A838', letterSpacing: '-0.04em' }}
                          >
                            85
                          </span>
                          <span className="text-[10px]" style={{ color: 'rgba(26,43,39,0.4)' }}>
                            쾌변 점수
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* ... (기존 리포트 내용) */}
                    <div
                      className="rounded-2xl p-4 mb-4"
                      style={{
                        background: 'rgba(27,67,50,0.05)',
                        border: '1px solid rgba(82,183,136,0.18)',
                      }}
                    >
                      <p className="text-xs font-bold mb-3" style={{ color: '#2D6A4F' }}>
                        🤖 AI 인사이트
                      </p>
                      <p
                        className="text-sm leading-relaxed mb-3"
                        style={{ color: 'rgba(26,43,39,0.7)' }}
                      >
                        성격이 급하신가요? 배변 데이터가 조금 불규칙해요. 다음 주는 조금 더 여유를
                        가져보세요.
                      </p>
                    </div>
                  </>
                )}
                <div className="flex gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setReportOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-sm"
                    style={{ background: '#1B4332', color: '#fff' }}
                  >
                    닫기
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 프리미엄 전용 정밀 분석 모달 */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPremiumModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-3xl overflow-hidden flex flex-col max-h-[90dvh] border border-white/20"
            >
              <div className="sticky top-0 z-10 px-10 py-8 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Crown size={24} className="text-amber-950" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#1A2B27] tracking-tight">
                      AI 맞춤 프리미엄 솔루션
                    </h3>
                    <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mt-0.5">
                      AI Poo Premium Guide
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar text-left font-['Pretendard']">
                <div className="rounded-[32px] bg-emerald-50/50 border border-emerald-100 p-8 shadow-inner">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-emerald-500" />
                    <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">
                      분석가 조언
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900 leading-relaxed italic">
                    "{reportData?.solution}"
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-2">
                    <Activity size={20} className="text-amber-500" />
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                      상세 분석 데이터
                    </span>
                  </div>
                  <div className="bg-gray-50/50 rounded-[32px] border border-gray-100 p-8 shadow-sm overflow-x-auto custom-scrollbar">
                    <div className="prose prose-emerald max-w-none text-gray-700 font-medium leading-extra-relaxed text-sm md:text-base prose-headings:font-black prose-headings:text-[#1A2B27] prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-emerald-700 prose-table:break-keep">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {reportData?.premiumSolution || '정밀 분석 결과를 불러오는 중입니다...'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[32px] bg-[#1A2B27] text-white flex items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <p className="text-amber-400 font-black text-sm mb-1">
                      PREMIUM Membership Benefit
                    </p>
                    <p className="text-white/60 text-xs font-bold leading-relaxed">
                      이 분석은 오직 프리미엄 회원에게만 <br />
                      제공되는 전문적인 쾌변 가이드입니다.
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                    <CheckCircle2 className="text-amber-400" size={28} />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all shadow-sm"
                >
                  닫기
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 py-4 bg-[#1B4332] text-white font-black rounded-2xl shadow-xl shadow-emerald-900/10 hover:shadow-emerald-900/30 transition-all"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 설정 탭 ───────────────────────────────────────────────────────────
function SettingsTab({
  user,
  refreshUser,
  logout,
  deleteMe,
}: {
  user: UserResponse | null;
  refreshUser: () => void;
  logout: () => Promise<void>;
  deleteMe: () => Promise<void>;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [modalType, setModalType] = useState<
    'nickname' | 'password' | 'withdraw' | 'cancelSubscription' | null
  >(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    try {
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error('Logout failed:', err);
      // 에러가 나더라도 클라이언트 상태는 이미 로그아웃 처리되었을 것이므로 메인으로 이동
      navigate('/');
    }
  };

  const handleNicknameChange = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.patch('/auth/profile', { nickname: inputValue });
      alert('닉네임이 변경되었습니다.');
      refreshUser();
      setModalType(null);
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.patch('/auth/password', { password: inputValue });
      alert('비밀번호가 변경되었습니다.');
      setModalType(null);
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setIsSubmitting(true);
    try {
      await deleteMe();
      alert('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');
      setModalType(null);
    } catch (err: any) {
      console.error('회원 탈퇴 에러:', err);
      alert(err.message || '회원 탈퇴 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSubscriptionInfo = async () => {
    try {
      const data = await api.get('/subscriptions/me');
      setSubscriptionInfo(data);
    } catch (err: any) {
      console.error('구독 정보 조회 실패:', err);
      alert('구독 정보를 불러올 수 없습니다.');
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        '정말로 구독을 해지하시겠습니까?\n\n해지 후에도 만료일까지는 서비스를 이용하실 수 있습니다.',
      )
    )
      return;

    setIsSubmitting(true);
    try {
      await api.post('/subscriptions/cancel');
      alert('구독이 해지되었습니다. 만료일까지 서비스를 이용하실 수 있습니다.');
      setModalType(null);
      await refreshUser();
      await loadSubscriptionInfo();
    } catch (err: any) {
      console.error('구독 해지 에러:', err);
      alert(err.message || '구독 해지에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      title: '기본 정보',
      items: [
        {
          label: '이메일 주소',
          value: user?.email || '데이터 없음',
          icon: <Package size={18} />,
          action: null,
        },
        {
          label: '현재 닉네임',
          value: user?.nickname || '데이터 없음',
          icon: <Activity size={18} />,
          action: '변경',
          onClick: () => {
            setInputValue(user?.nickname || '');
            setModalType('nickname');
          },
        },
        {
          label: '접속 비밀번호',
          value: '********',
          icon: <Lock size={18} />,
          action: '설정',
          onClick: () => {
            setInputValue('');
            setModalType('password');
          },
        },
      ],
    },
    {
      title: '멤버십 및 계정',
      items: [
        {
          label: '멤버십 등급',
          value: (() => {
            if (!user) return 'FREE 일반 회원';
            if (user.isPro && user.subscription) {
              const plan = user.subscription.plan;
              if (plan === 'PRO') return 'PRO 멤버십';
              if (plan === 'PREMIUM') return 'PREMIUM 멤버십';
              return `${plan} 멤버십`;
            }
            return 'FREE 일반 회원';
          })(),
          icon: <Trophy size={18} />,
          action: '관리',
          onClick: async () => {
            if (!user?.isPro || !user?.subscription) {
              navigate('/premium');
            } else {
              await loadSubscriptionInfo();
              setModalType('cancelSubscription');
            }
          },
        },
        {
          label: '계정 생성일',
          value: user?.createdAt ? (user.createdAt as string).split('T')[0] : '-',
          icon: <Calendar size={18} />,
          action: null,
        },
      ],
    },
  ];

  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8"
    >
      {sections.map((section, idx) => (
        <motion.div
          key={idx}
          variants={fadeUp(idx * 0.1)}
          className="bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-2 sm:p-4"
        >
          <div className="px-4 sm:px-10 pt-6 sm:pt-10 pb-4 sm:pb-6">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.25em] mb-2">
              {section.title}
            </p>
          </div>
          <div className="px-6 pb-6">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 sm:p-6 rounded-[24px] sm:rounded-3xl hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shadow-inner shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-0.5 sm:mb-1">{item.label}</p>
                    <p className="text-sm sm:text-lg font-black text-[#1A2B27] tracking-tight truncate">{item.value}</p>
                  </div>
                </div>
                {item.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={item.onClick}
                    className="px-4 py-2 sm:px-6 sm:py-3 rounded-[14px] sm:rounded-2xl text-[11px] sm:text-sm font-black bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all shrink-0 ml-2"
                  >
                    {item.action}
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div variants={fadeUp(0.3)} className="flex flex-col gap-4 mb-20">
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="flex-[2] py-6 rounded-[32px] bg-white border border-gray-100 text-gray-500 font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-gray-100/20 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={20} /> 로그아웃 하기
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setInputValue('');
              setModalType('withdraw');
            }}
            className="flex-1 py-6 rounded-[32px] bg-red-50 border border-red-100/50 text-red-400 font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-red-100/20 hover:bg-red-100/30 transition-colors"
          >
            <Trash2 size={18} /> 회원 탈퇴
          </motion.button>
        </div>
        <p className="text-center text-xs text-gray-300 font-black uppercase tracking-[0.3em] py-8">
          DayPoo App Version 2.5.0 (Standard)
        </p>
      </motion.div>

      {/* 모달 */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-10 shadow-3xl border border-white"
            >
              {modalType === 'cancelSubscription' ? (
                /* 구독 해지 모달 */
                <>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-amber-50 text-amber-600">
                    <Crown size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1A2B27] mb-2">멤버십 구독 관리</h3>

                  {subscriptionInfo ? (
                    <div className="space-y-6 mb-8">
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">구독 플랜</span>
                          <span
                            className={`font-black text-lg ${
                              subscriptionInfo.plan === 'PREMIUM'
                                ? 'text-[#1B4332]'
                                : 'text-[#E8A838]'
                            }`}
                          >
                            {subscriptionInfo.plan} 멤버십
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">구독 상태</span>
                          <span
                            className={`font-black text-sm ${
                              subscriptionInfo.status === 'ACTIVE'
                                ? 'text-emerald-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {subscriptionInfo.status === 'ACTIVE'
                              ? '활성'
                              : subscriptionInfo.status === 'CANCELLED'
                                ? '해지됨'
                                : '만료'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">만료일</span>
                          <span className="font-black text-sm text-[#1A2B27]">
                            {subscriptionInfo.endDate
                              ? new Date(subscriptionInfo.endDate).toLocaleDateString('ko-KR')
                              : '-'}
                          </span>
                        </div>
                        {subscriptionInfo.daysRemaining !== null && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">남은 기간</span>
                            <span className="font-black text-sm text-emerald-600">
                              {subscriptionInfo.daysRemaining}일
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">자동 갱신</span>
                          <span
                            className={`font-black text-sm ${
                              subscriptionInfo.isAutoRenewal ? 'text-emerald-600' : 'text-gray-400'
                            }`}
                          >
                            {subscriptionInfo.isAutoRenewal ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>

                      {subscriptionInfo.status === 'ACTIVE' && (
                        <p className="text-xs font-medium text-gray-400 leading-relaxed">
                          구독을 해지하시면 만료일까지 서비스를 이용하실 수 있습니다.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-400">구독 정보를 불러오는 중...</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalType(null)}
                      className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                    >
                      닫기
                    </button>
                    {subscriptionInfo?.status === 'ACTIVE' && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-red-500 text-white font-black rounded-[20px] shadow-xl shadow-red-900/20 disabled:opacity-50 hover:bg-red-600 transition-colors"
                      >
                        {isSubmitting ? '처리 중...' : '구독 해지'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* 기존 모달 (닉네임/비밀번호/탈퇴) */
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${modalType === 'withdraw' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}
                  >
                    {modalType === 'nickname' ? (
                      <Activity size={28} />
                    ) : modalType === 'password' ? (
                      <Lock size={28} />
                    ) : (
                      <Trash2 size={28} />
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-[#1A2B27] mb-2">
                    {modalType === 'nickname'
                      ? '새로운 닉네임'
                      : modalType === 'password'
                        ? '비밀번호 재설정'
                        : '계정 삭제'}
                  </h3>
                  <p className="text-xs font-medium text-gray-400 mb-8 leading-relaxed">
                    {modalType === 'nickname'
                      ? '부르고 싶은 멋진 닉네임을 입력해주세요.'
                      : modalType === 'password'
                        ? '보안을 위해 강력한 비밀번호를 설정하세요.'
                        : '탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.'}
                  </p>

                  {modalType !== 'withdraw' && (
                    <input
                      type={modalType === 'nickname' ? 'text' : 'password'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={modalType === 'nickname' ? '닉네임 입력' : '비밀번호 입력'}
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[20px] mb-8 outline-none focus:border-emerald-500/30 font-black text-lg text-[#1A2B27] placeholder:text-gray-400"
                    />
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalType(null)}
                      className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={
                        modalType === 'nickname'
                          ? handleNicknameChange
                          : modalType === 'password'
                            ? handlePasswordChange
                            : handleWithdraw
                      }
                      disabled={isSubmitting}
                      className="flex-1 py-4 bg-[#1B4332] text-white font-black rounded-[20px] shadow-xl shadow-emerald-900/20 disabled:opacity-50"
                    >
                      {isSubmitting ? '처리 중...' : '확인'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── MyPage ────────────────────────────────────────────────────────────
export function MyPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, refreshUser, isAuthenticated, logout, deleteMe } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [showHealthLog, setShowHealthLog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [prevTab, setPrevTab] = useState<TabKey>('home');
  const reportCacheRef = useRef<Record<string, any>>({});
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [equipped, setEquipped] = useState<AvatarItem | null>(null);
  const [equippedEffect, setEquippedEffect] = useState<AvatarItem | null>(null);

  const handleStandaloneHealthLog = useCallback(
    async (result: HealthLogResult) => {
      try {
        const payload: HealthRecordRequest = {
          conditionTags: result.conditionTags,
          dietTags: result.foodTags,
          ...(result.bristolType !== null && { bristolScale: result.bristolType }),
          ...(result.color !== null && { color: result.color }),
        };
        await api.post('/records', payload);
        setShowHealthLog(false);
        await fetchRecords();
        await refreshUser();
      } catch (e: any) {
        alert(`기록 저장 실패: ${e.message || '서버 오류'}`);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [refreshUser],
  );

  const fetchRecords = useCallback(async () => {
    try {
      const data = await api.get<any>('/records');
      // 페이지네이션 응답({ content: [...] })과 배열 응답 모두 처리
      const records = Array.isArray(data) ? data : (data?.content ?? []);
      setRecords(records);
    } catch (err) {
      console.error('Failed to fetch records', err);
    }
  }, []);

  const fetchShopData = useCallback(async () => {
    try {
      const [resItems, resTitles, resInventory] = await Promise.allSettled([
        api.get<any[]>('/shop/items'),
        api.get<any[]>('/shop/titles'),
        api.get<any[]>('/shop/inventory'), // 인벤토리 추가
      ]);

      const itemsData = resItems.status === 'fulfilled' ? resItems.value : [];
      const titlesData = resTitles.status === 'fulfilled' ? resTitles.value : [];
      const inventoryData = resInventory.status === 'fulfilled' ? resInventory.value : [];

      // 🚀 서버 데이터 정밀 매핑 (관리자 페이지 연동)
      // 데이터가 배열인지 한 번 더 검증 (방어적 코드)
      const safeItems = Array.isArray(itemsData) ? itemsData : [];
      const safeTitles = Array.isArray(titlesData) ? titlesData : [];
      const safeInventory = Array.isArray(inventoryData) ? inventoryData : [];

      // 인벤토리 맵 생성 (itemId -> { inventoryId, isEquipped })
      const inventoryMap = new Map<string, { inventoryId: string; isEquipped: boolean }>();
      safeInventory.forEach((inv) => {
        if (inv.itemId) {
          inventoryMap.set(String(inv.itemId), {
            inventoryId: String(inv.id),
            isEquipped: inv.isEquipped === true,
          });
        }
      });

      const mappedItems: AvatarItem[] = safeItems.map((item) => {
        const itemType = item.type || 'AVATAR';
        const itemId = String(item.id || Math.random());
        const inventoryInfo = inventoryMap.get(itemId);

        return {
          id: itemId,
          emoji:
            item.imageUrl || (itemType === 'AVATAR' ? '🎭' : itemType === 'EFFECT' ? '✨' : '📍'),
          imageUrl: item.imageUrl, // 원본 imageUrl 보존
          name: item.name || '알 수 없는 아이템',
          type: itemType === 'AVATAR' ? '헤드' : itemType === 'EFFECT' ? '이펙트' : '마커',
          rawType: itemType, // 원본 타입 저장
          owned: item.owned === true || false,
          price: item.price || 0,
          discountPrice: item.discountPrice ?? null, // 할인가 매핑 추가
          inventoryId: inventoryInfo?.inventoryId,
          isEquipped: inventoryInfo?.isEquipped || false,
        };
      });

      // 🚀 인벤토리 전용 아이템(비매품/기본템) 병합 로직 추가
      // 상점 응답(/shop/items)에 없더라도 인벤토리 응답(/shop/inventory)에 있다면 수동으로 mappedItems에 추가합니다.
      safeInventory.forEach((inv) => {
        const itemId = String(inv.itemId);
        const exists = mappedItems.find((m) => m.id === itemId);

        if (!exists) {
          const itemType = inv.itemType || 'AVATAR';
          mappedItems.push({
            id: itemId,
            emoji:
              inv.imageUrl || (itemType === 'AVATAR' ? '🎭' : itemType === 'EFFECT' ? '✨' : '📍'),
            imageUrl: inv.imageUrl,
            name: inv.itemName || '비매품 아이템',
            type: itemType === 'AVATAR' ? '헤드' : itemType === 'EFFECT' ? '이펙트' : '마커',
            rawType: itemType,
            owned: true, // 인벤토리에 존재하면 무조건 소유한 것
            price: 0,
            inventoryId: String(inv.id),
            isEquipped: inv.isEquipped === true,
          });
        }
      });

      const mappedTitles = safeTitles.map((t) => ({
        id: String(t.id || Math.random()),
        label: t.name || t.label || '비밀 칭호',
        description: t.description || '',
        earned: t.isOwned === true || t.owned === true || t.earned === true || false,
        selected: t.isEquipped === true || t.equipped === true || t.selected === true || false,
        achievementType: t.achievementType,
        achievementThreshold: t.achievementThreshold,
        currentProgress: t.currentProgress || 0,
        conditionLabel: t.conditionLabel || t.requirementDescription || '활동을 통해 획득 가능',
      }));

      console.log('Mapped Store & Collection Data:', { mappedItems, mappedTitles });

      setAvatarItems(mappedItems);
      setTitles(mappedTitles);

      // 장착된 AVATAR 타입 아이템 찾기 (프로필 아바타 표시용)
      const equip = mappedItems.find((i) => i.isEquipped === true && i.rawType === 'AVATAR');
      setEquipped(equip || null);

      // 장착된 EFFECT 타입 아이템 찾기 (아바타 주변 이펙트 표시용)
      const effect = mappedItems.find((i) => i.isEquipped === true && i.rawType === 'EFFECT');
      setEquippedEffect(effect || null);
    } catch (err) {
      console.error('마이페이지 연동 실패 (Critical):', err);
    }
  }, []);

  useEffect(() => {
    // URL 쿼리 파라미터 확인 (예: /mypage?tab=collection&sub=shop)
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabKey;
    if (tabParam && tabOrder.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        openAuth('login');
      } else {
        fetchRecords();
        fetchShopData();
      }
    }
  }, [loading, isAuthenticated, navigate, openAuth, fetchRecords, fetchShopData]);

  const tabOrder: TabKey[] = ['home', 'collection', 'report', 'settings'];
  const tabDir = tabOrder.indexOf(activeTab) >= tabOrder.indexOf(prevTab) ? 1 : -1;

  const handleTabChange = (k: TabKey) => {
    setPrevTab(activeTab);
    setActiveTab(k);
  };

  const slideVar = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  if (loading) {
    return <MyPageSkeleton />;
  }

  if (!user) {
    const features = [
      { icon: <BarChart3 size={18} />, text: '나의 배변 통계 분석' },
      { icon: <Trophy size={18} />, text: '랭킹 & 칭호 수집' },
      { icon: <Crown size={18} />, text: '아바타 꾸미기' },
      { icon: <Brain size={18} />, text: 'AI 배변 패턴 리포트' },
    ];
    return (
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: '#f0f7f4' }}
      >
        {/* 배경 floating blobs */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{
              width: `${180 + i * 60}px`,
              height: `${180 + i * 60}px`,
              background: i % 2 === 0 ? '#52b788' : '#2D6A4F',
              left: `${[10, 60, 80, 5, 45, 70][i]}%`,
              top: `${[10, 5, 40, 65, 75, 20][i]}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 5 + i * 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}

        {/* 흐릿한 마이페이지 미리보기 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="w-full h-full opacity-10 blur-sm scale-105"
            style={{
              background:
                'repeating-linear-gradient(0deg, #d8f3dc 0px, #d8f3dc 2px, transparent 2px, transparent 40px), repeating-linear-gradient(90deg, #d8f3dc 0px, #d8f3dc 2px, transparent 2px, transparent 40px)',
            }}
          />
        </div>

        {/* 메인 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-sm mx-4"
        >
          <div
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(82,183,136,0.2)',
            }}
          >
            {/* 헤더 그라데이션 */}
            <div
              className="relative h-32 flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52b788 100%)' }}
            >
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 8, repeat: Infinity }}
                style={{
                  background:
                    'radial-gradient(circle at 30% 50%, #95d5b2 0%, transparent 60%), radial-gradient(circle at 70% 50%, #1b4332 0%, transparent 60%)',
                }}
              />
              {/* 자물쇠 아이콘 */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <Lock size={28} color="white" strokeWidth={2} />
              </motion.div>
            </div>

            {/* 콘텐츠 */}
            <div className="px-6 py-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-1">마이페이지</h2>
                <p className="text-sm text-gray-500">로그인하고 나만의 공간을 만들어보세요</p>
              </motion.div>

              {/* 기능 목록 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-2 mb-6"
              >
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.07 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
                    style={{ background: '#f0faf5', color: '#2D6A4F' }}
                  >
                    <span style={{ color: '#52b788' }}>{f.icon}</span>
                    {f.text}
                  </motion.div>
                ))}
              </motion.div>

              {/* 버튼 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="flex flex-col gap-2.5"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openAuth('login')}
                  className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52b788 100%)' }}
                >
                  <Sparkles size={16} />
                  로그인하기
                  <ArrowRight size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/')}
                  className="w-full py-3 rounded-2xl text-sm font-medium"
                  style={{ background: '#f0faf5', color: '#52b788', border: '1px solid #d8f3dc' }}
                >
                  홈으로 돌아가기
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* 하단 힌트 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs mt-4"
            style={{ color: 'rgba(45,106,79,0.5)' }}
          >
            계정이 없으신가요?{' '}
            <button
              onClick={() => openAuth('signup')}
              className="font-semibold underline underline-offset-2"
              style={{ color: '#2D6A4F' }}
            >
              회원가입
            </button>
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8faf9' }}>
      <Navbar openAuth={openAuth} />
      <HeroBanner
        equippedItem={equipped}
        equippedEffect={equippedEffect}
        onAvatarClick={() => handleTabChange('home')}
        user={user}
        records={records}
      />
      <TabBar active={activeTab} onChange={handleTabChange} />
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-20 sm:pb-40 overflow-hidden">
        <AnimatePresence mode="wait" custom={tabDir}>
          <motion.div
            key={activeTab}
            custom={tabDir}
            variants={slideVar}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'home' && (
              <HomeTab
                equipped={equipped}
                setEquipped={setEquipped}
                user={user}
                avatarItems={avatarItems}
                setAvatarItems={setAvatarItems}
                initialShopTab={
                  new URLSearchParams(location.search).get('sub') === 'shop' ? 'shop' : 'inventory'
                }
                refreshUser={refreshUser}
                fetchShopData={fetchShopData}
                onTabChange={handleTabChange}
                records={records}
              />
            )}
            {activeTab === 'collection' && (
              <CollectionTab
                titles={titles}
                setTitles={setTitles}
                onRefresh={fetchShopData}
                onRefreshUser={refreshUser}
              />
            )}
            {activeTab === 'report' && (
              <ReportTab
                records={records}
                reportCacheRef={reportCacheRef}
                onAddRecord={() => setShowHealthLog(true)}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                user={user}
                refreshUser={refreshUser}
                logout={logout}
                deleteMe={deleteMe}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 전역 배변 기록 모달 */}
      <AnimatePresence>
        {showHealthLog && (
          <HealthLogModal
            onClose={() => setShowHealthLog(false)}
            onComplete={handleStandaloneHealthLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
