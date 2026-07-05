import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WaveDivider } from '../components/WaveDivider';
import { Crown, TrendingUp, TrendingDown, Minus, ShoppingBag, X, MapPin, Star, Trophy, Activity } from 'lucide-react';
import { useRankings } from '../hooks/useRankings';
import { generateRankingAvatar, generateItemAvatar, parseDicebearUrl, DEFAULT_AVATAR_URL, isEmoji } from '../utils/avatar';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WaveButtonComponent from '../components/WaveButton';
import { GridFlipReveal } from '../components/GridFlipReveal';
import { isTouchDevice } from '../hooks/useIsTouchDevice';

// ── 타입 ──────────────────────────────────────────────────────────────
type TabKey = 'total' | 'local' | 'health';

interface RankUser {
  rank: number;
  emoji: string;
  avatarUrl?: string; // DiceBear 아바타 URL
  nick: string;
  title: string;
  titleColor: string;
  titleBg: string;
  level: number; // 신규 추가
  score: number;
  scoreLabel: string;
  change: number;
  items: { icon: string; name: string; type: string }[];
  effectEmoji?: string;
}

// ── 이펙트 오라 ─────────────────────────────────────────────────────
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

function RankAvatarEffect({ emoji, size = 96 }: { emoji: string; size?: number }) {
  const particles = Array.from({ length: 4 }, (_, i) => i);
  const auraColor = EFFECT_AURA_COLORS[emoji] || 'rgba(250, 204, 21, 0.4)';
  const auraSize = size + 20;
  return (
    <div className="absolute inset-0 pointer-events-none z-30" style={{ overflow: 'visible' }}>
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
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {particles.map((i) => {
        const angle = (i / 4) * 360;
        const radius = size / 2 + 12;
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: '50%', top: '50%', marginLeft: '-8px', marginTop: '-8px', fontSize: '12px' }}
            animate={{
              x: [0, Math.cos((angle * Math.PI) / 180) * radius],
              y: [0, Math.sin((angle * Math.PI) / 180) * radius],
              opacity: [0, 1, 0],
              scale: [0.3, 1, 0.3],
            }}
            transition={{ duration: 2.2, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
}

// ── 애니메이션 보더 ───────────────────────────────────────────────────
function ConicGlow({ color, thickness = 1.5, borderRadius = '16px' }: { color: string; thickness?: number; borderRadius?: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius }}>
      <motion.div
        style={{
          position: 'absolute',
          inset: '-200%',
          background: `conic-gradient(from 0deg, transparent 0%, ${color} 15%, transparent 30%, transparent 50%, ${color} 65%, transparent 80%, transparent 100%)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ── 데이터 ────────────────────────────────────────────────────────────
const TAB_CONFIG: { key: TabKey; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'total',  label: '전체 랭킹',    desc: '기록 인증 + 장소 방문 점수 합산',          icon: <Trophy size={16} /> },
  { key: 'local',  label: '우리 동네 왕',  desc: '현재 위치 기반 지역 활동 점수',     icon: <MapPin size={16} /> },
  { key: 'health', label: '건강왕',        desc: 'AI 쾌변 점수 기준',            icon: <Activity size={16} /> },
];

// ── 순위 변화 아이콘 ──────────────────────────────────────────────────
function ChangeIcon({ change }: { change: number }) {
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#52b788' }}>
      <TrendingUp size={11} /> {change}
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#E85D5D' }}>
      <TrendingDown size={11} /> {Math.abs(change)}
    </span>
  );
  return <Minus size={11} style={{ color: 'rgba(0,0,0,0.1)' }} />;
}

// ── 아이템 팝업 ───────────────────────────────────────────────────────
function ItemPopup({ user, onClose, openAuth }: { user: RankUser; onClose: () => void; openAuth: (mode: 'login' | 'signup') => void }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goToShop = () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    navigate('/mypage?tab=home&sub=shop');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[300] bg-[#0A1A14]/60 backdrop-blur-md"
      />
      
      <div className="fixed inset-0 flex items-center justify-center z-[301] pointer-events-none p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-[380px] bg-white rounded-[44px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.25)] border border-white relative pointer-events-auto"
        >
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#1B4332]/5 to-transparent pointer-events-none" />
          <div className="absolute top-8 right-10 w-24 h-24 bg-emerald-100/30 blur-3xl rounded-full" />
          
          <div className="p-8 pt-10 relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center mb-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 shadow-xl relative"
                style={{ background: '#fff', border: `3.5px solid ${user.titleColor}20` }}
              >
                {user.effectEmoji && <RankAvatarEffect emoji={user.effectEmoji} size={96} />}
                <ConicGlow color={user.titleColor} thickness={4} borderRadius="50%" />
                <div className="absolute inset-[4px] rounded-full bg-white flex items-center justify-center z-10 overflow-hidden">
                  {isEmoji(user.avatarUrl) ? (
                    <span className="text-5xl select-none leading-none">{user.avatarUrl}</span>
                  ) : (
                    <img src={user.avatarUrl || DEFAULT_AVATAR_URL} alt={user.nick} className="w-full h-full object-cover" />
                  )}
                </div>
                {user.rank <= 3 && (
                  <div className="absolute -top-6 -right-2 text-amber-500 transform rotate-12 drop-shadow-lg">
                    <Crown size={28} />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <motion.span
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
                  style={{ background: user.titleBg, color: user.titleColor }}
                >
                  {user.title}
                </motion.span>
                <h3 className="text-2xl font-black text-[#1A2B27] leading-tight mb-1">{user.nick}</h3>
                <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                  <span className="text-sm font-black whitespace-nowrap">{user.score.toLocaleString()}{user.scoreLabel}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-bold">전체 {user.rank}위</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100/50 mb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> 착용 중인 아이템
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {user.items.length}개
                </span>
              </div>

              {user.items.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2 opacity-40">
                  <ShoppingBag size={24} strokeWidth={1} />
                  <p className="text-sm font-medium">착용 중인 아이템이 없습니다</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {user.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                        {isEmoji(item.icon) ? (
                          <span className="text-3xl select-none leading-none">{item.icon}</span>
                        ) : (
                          <img 
                            src={parseDicebearUrl(item.icon, item.name, item.type)} 
                            alt={item.name} 
                            className="w-full h-full object-contain p-1" 
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#1A2B27] truncate">{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">{item.type}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <WaveButtonComponent
              onClick={goToShop}
              variant="accent"
              size="lg"
              className="w-full shadow-2xl"
              icon={<ShoppingBag size={20} />}
            >
              상점 가서 이 아이템 보기
            </WaveButtonComponent>
            <p className="text-center text-[10px] text-gray-300 font-bold mt-4 tracking-tight">
              나만의 스타일로 랭킹 페이지를 꾸며보세요!
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── 시상대 섹션 (3D Flip & Repulsion Interaction) ──────────────────────────
const FlipGlassCard = ({ 
  user, 
  scale = 1, 
  delay = 0, 
  isFirst = false, 
  onSelect,
  isHovered,
  onHoverStart,
  onHoverEnd,
  xOffset = 0
}: { 
  user: RankUser; 
  scale?: number; 
  delay?: number; 
  isFirst?: boolean;
  onSelect: (u: RankUser) => void;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  xOffset?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 32, scale: scale * 0.9 }}
    animate={{ 
      opacity: 1, 
      y: 0, 
      scale: isHovered ? scale * 1.08 : scale,
      x: xOffset 
    }}
    transition={{ 
      duration: 0.8, 
      delay, 
      ease: [0.16, 1, 0.3, 1],
      x: { type: 'spring', stiffness: 100, damping: 20 }
    }}
    onMouseEnter={onHoverStart}
    onMouseLeave={onHoverEnd}
    onClick={() => onSelect(user)}
    className="relative cursor-pointer group"
    style={{
      width: isFirst ? 'min(190px, 34vw)' : 'min(160px, 30vw)',
      height: isFirst ? 'min(260px, 48vw)' : 'min(220px, 42vw)',
      perspective: '1200px',
      zIndex: isHovered ? 50 : isFirst ? 20 : 10 
    }}
  >
    {/* ── 배지 레이어 (Clipping 해결을 위해 최상위로 독립) ── */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-black text-[10px] shadow-xl z-[60] transition-transform duration-500"
      style={{ 
        background: user.rank === 1 ? '#E8A838' : user.rank === 2 ? '#B0B8B4' : '#CD7C4A', 
        color: '#fff',
        boxShadow: `0 4px 15px ${user.rank === 1 ? 'rgba(232,168,56,0.3)' : user.rank === 2 ? 'rgba(176,184,180,0.3)' : 'rgba(205,124,74,0.3)'}`,
        transform: `translateX(-50%) ${isHovered ? 'rotateY(180deg) scale(0)' : 'rotateY(0) scale(1)'}`, // 뒤집힐 때 숨김
        opacity: isHovered ? 0 : 1
      }}>
      {user.rank}{user.rank === 1 ? 'ST' : user.rank === 2 ? 'ND' : 'RD'}
    </div>

    <motion.div
      animate={{ rotateY: isHovered ? 180 : 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
      className="relative w-full h-full"
    >
      {/* ── 앞면 (Front Face) ── */}
      <div 
        className="absolute inset-0 w-full h-full rounded-[24px] sm:rounded-[36px] overflow-hidden flex flex-col items-center p-3 sm:p-5 pb-4 sm:pb-6 border border-white/40 shadow-xl"
        style={{ 
          backfaceVisibility: 'hidden',
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
        
        <div className="relative mb-3 sm:mb-5 mt-2 sm:mt-4">
          <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center relative text-2xl sm:text-4xl bg-white shadow-2xl">
            {user.effectEmoji && <RankAvatarEffect emoji={user.effectEmoji} size={80} />}
            <ConicGlow color={user.titleColor} thickness={4} borderRadius="50%" />
            <div className="absolute inset-[4px] rounded-full bg-white flex items-center justify-center z-10 overflow-hidden">
              {isEmoji(user.avatarUrl) ? (
                <span className="text-3xl select-none leading-none">{user.avatarUrl}</span>
              ) : (
                <img src={user.avatarUrl || DEFAULT_AVATAR_URL} alt={user.nick} className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          {isFirst && <div className="absolute -top-5 -right-2 text-amber-500 drop-shadow-lg scale-110"><Crown size={24} /></div>}
        </div>

        <h3 className="font-black text-[#1A2B27] text-[11px] sm:text-[16px] mb-0.5 sm:mb-1 truncate w-full text-center">{user.nick}</h3>
        <p className="font-black text-sm sm:text-xl" style={{ color: '#52b788' }}>
          {user.score.toLocaleString()}<span className="text-[8px] sm:text-[10px] uppercase font-bold text-gray-400 ml-0.5">{user.scoreLabel}</span>
        </p>
      </div>

      {/* ── 뒷면 (Back Face) ── */}
      <div
        className="absolute inset-0 w-full h-full rounded-[36px] overflow-hidden flex flex-col items-center justify-center p-6 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.4)]"
        style={{
          backfaceVisibility: 'hidden',
          background: 'rgba(10, 26, 20, 0.95)',
          backdropFilter: 'blur(30px)',
          transform: 'rotateY(180deg)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1B4332]/20 via-transparent to-amber-500/5 pointer-events-none" />

        <div className="relative mb-4">
            <div className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-2 text-center">Power Status</div>
            <div className="flex items-baseline justify-center gap-1 grayscale group-hover:grayscale-0 transition-all duration-700">
                <span className="text-[12px] font-black text-amber-500">LV.</span>
                <span className="text-3xl font-black text-white leading-none">{user.level || '0'}</span>
            </div>
        </div>

        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

        <div className="w-full space-y-4">
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-[#52b788] uppercase tracking-widest mb-1">Current Power</span>
                <div className="text-lg font-black text-white/90">{user.score.toLocaleString()}</div>
            </div>

            <div className="flex justify-center gap-2">
                <div className="flex-1 bg-white/5 rounded-xl py-2 border border-white/5 flex flex-col items-center">
                    <span className="text-[8px] text-gray-400 font-black uppercase mb-0.5">Items</span>
                    <span className="text-xs font-black text-white">{user.items.length}ea</span>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl py-2 border border-white/5 flex flex-col items-center">
                    <span className="text-[8px] text-gray-400 font-black uppercase mb-0.5">등급</span>
                    <span className="text-xs font-black text-amber-500">
                      {user.rank === 1 ? '다이아몬드' : user.rank === 2 ? '플래티넘' : '골드'}
                    </span>
                </div>
            </div>
        </div>
      </div>
    </motion.div>

    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-5 bg-black/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  </motion.div>
);

function Podium({ users, onSelect }: { users: RankUser[]; onSelect: (u: RankUser) => void }) {
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/30 backdrop-blur-md rounded-[32px] border border-white/40">
        <p className="text-sm font-bold text-gray-500">아직 랭킹 데이터가 존재하지 않습니다.</p>
      </div>
    );
  }

  const [top1, top2, top3] = users;

  // Repulsion Logic 계산 함수
  const getXOffset = (rank: number) => {
    if (!hoveredRank) return 0;
    if (hoveredRank === rank) return 0; // 호버 중인 카드는 직접 움직이지 않음

    if (hoveredRank === 1) {
      if (rank === 2) return -35; 
      if (rank === 3) return 35;
    }
    if (hoveredRank === 2) {
      if (rank === 1) return 30;
      if (rank === 3) return 30;
    }
    if (hoveredRank === 3) {
      if (rank === 1) return -30;
      if (rank === 2) return -30;
    }
    return 0;
  };

  return (
    <div className="relative flex flex-row items-end justify-center gap-2 sm:gap-10 lg:gap-16 mt-8 pt-12 sm:pt-24 pb-16 px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, #E8A838 0%, transparent 65%)', filter: 'blur(70px)' }}
        />
      </div>

      {top2 && (
        <FlipGlassCard 
          user={top2} 
          delay={0.15} 
          isHovered={hoveredRank === 2}
          onHoverStart={() => setHoveredRank(2)}
          onHoverEnd={() => setHoveredRank(null)}
          xOffset={getXOffset(2)}
          onSelect={onSelect}
        />
      )}
      {top1 && (
        <FlipGlassCard 
          user={top1} 
          scale={1.15} 
          delay={0} 
          isFirst 
          isHovered={hoveredRank === 1}
          onHoverStart={() => setHoveredRank(1)}
          onHoverEnd={() => setHoveredRank(null)}
          xOffset={getXOffset(1)}
          onSelect={onSelect}
        />
      )}
      {top3 && (
        <FlipGlassCard 
          user={top3} 
          scale={0.95} 
          delay={0.3} 
          isHovered={hoveredRank === 3}
          onHoverStart={() => setHoveredRank(3)}
          onHoverEnd={() => setHoveredRank(null)}
          xOffset={getXOffset(3)}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

// ── 랭킹 리스트 아이템 ────────────────────────────────────────────────
function RankItem({
  user, index, onSelect,
}: { user: RankUser; index: number; onSelect: (u: RankUser) => void }) {
  const rankColor = user.rank === 1 ? '#E8A838' : user.rank === 2 ? '#B0B8B4' : user.rank === 3 ? '#CD7C4A' : 'rgba(27,67,50,0.08)';
  const isTop3 = user.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      onClick={() => onSelect(user)}
      whileHover={!isTouchDevice() ? { x: 4, scale: isTop3 ? 1.01 : 1 } : undefined}
      className="relative flex items-center gap-4 px-5 py-4.5 rounded-2xl cursor-pointer transition-all"
      style={{
        background: '#FFFFFF',
        border: isTop3 ? 'none' : '1.5px solid rgba(27,67,50,0.08)',
        marginBottom: '8px',
      }}
    >
      {isTop3 && (
        <>
          <ConicGlow color={rankColor} thickness={1.5} borderRadius="16px" />
          <div 
            className="absolute z-0 bg-white" 
            style={{ 
              inset: '1.5px', 
              borderRadius: '14.5px' 
            }} 
          />
        </>
      )}
      
      <div className="relative z-10 flex items-center gap-4 w-full">
      <span
        className="w-8 text-center font-black text-base flex-shrink-0"
        style={{ color: rankColor }}
      >
        {user.rank}
      </span>

      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 relative"
        style={{
          background: '#f4f9f6',
          border: `2px solid ${user.titleColor}20`,
        }}
      >
        {user.effectEmoji && (
          <motion.div
            className="absolute inset-[-4px] rounded-full pointer-events-none z-0"
            style={{ background: `radial-gradient(circle, ${EFFECT_AURA_COLORS[user.effectEmoji] || 'rgba(250,204,21,0.4)'} 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className="w-full h-full rounded-full overflow-hidden relative z-10 flex items-center justify-center">
          {isEmoji(user.avatarUrl) ? (
            <span className="text-2xl select-none leading-none">{user.avatarUrl}</span>
          ) : (
            <img src={user.avatarUrl || DEFAULT_AVATAR_URL} alt={user.nick} className="w-full h-full object-cover" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div>
          <span
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1"
            style={{ background: user.titleBg, color: user.titleColor }}
          >
            {user.title}
          </span>
        </div>
        <p className="font-black text-[#1A2B27] text-lg leading-tight truncate">{user.nick}</p>
      </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="font-black text-xl" style={{ color: '#52b788', letterSpacing: '-0.03em' }}>
            {user.score.toLocaleString()}{user.scoreLabel}
          </span>
          <ChangeIcon change={user.change} />
        </div>
      </div>
    </motion.div>
  );
}

// ── 내 순위 고정 바 ───────────────────────────────────────────────────
function MyRankBar({ data }: { data: any }) {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group border border-white/20 shadow-2xl hover:shadow-emerald-900/10 transition-all duration-700"
      style={{ 
        background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 10
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8A838]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#E8A838]/10 transition-colors" />
      
      <div className="flex-1 flex items-center gap-10 z-10 w-full">
        <div className="text-center min-w-[100px]">
          <span className="block text-emerald-300/50 text-xs font-bold uppercase tracking-widest mb-2">나의 현재 순위</span>
          <div className="relative">
            <span className="text-4xl sm:text-6xl font-black text-[#E8A838] leading-none tracking-tighter">
              {data.rank === '-' ? '-' : data.rank}
            </span>
            {data.rank !== '-' && <span className="text-lg sm:text-xl font-bold text-[#E8A838] ml-0.5">위</span>}
          </div>
        </div>
        
        <div className="h-14 w-px bg-white/10 hidden md:block" />

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2.5">
            <span className="text-xl sm:text-2xl font-black text-white">{data.nick}</span>
            <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
              Lv.{data.lv}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/30 bg-white flex items-center justify-center text-2xl">
                {(() => {
                  const avatarUrl = generateRankingAvatar(data.userId || 0, data.rank === '-' ? 99 : data.rank, data.equippedAvatarUrl);
                  return isEmoji(avatarUrl) ? (
                    <span className="select-none leading-none">{avatarUrl}</span>
                  ) : (
                    <img src={avatarUrl} alt="My Avatar" className="w-full h-full object-cover" />
                  );
                })()}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E8A838] shadow-[0_0_10px_rgba(232,168,56,0.5)]" />
                  <span className="text-white/40 text-sm font-medium">활동 점수</span>
                  <span className="text-white font-black text-2xl tracking-tight">{data.score.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WaveButtonComponent
        onClick={() => navigate('/map')}
        variant="accent"
        size="lg"
        className="w-full md:w-auto shadow-2xl"
      >
        지금 바로 도전하기 →
      </WaveButtonComponent>
    </motion.div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function RankingPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>('total');
  const [selectedUser, setSelectedUser] = useState<RankUser | null>(null);
  const regionName = user?.homeRegion ?? undefined;

  const { data, loading, error } = useRankings(tab, regionName);

  const isDataValid = !!data;
  const users: RankUser[] = (isDataValid && Array.isArray(data.topRankers))
    ? data.topRankers
        .filter(r => r && typeof r === 'object')
        .map((r) => ({
          rank: Number(r.rank || 0),
          emoji: Number(r.rank) === 1 ? '💎' : Number(r.rank) === 2 ? '🦊' : '🐸',
          avatarUrl: generateRankingAvatar(r.userId, Number(r.rank || 0), r.equippedAvatarUrl),
          nick: r.nickname || '익명',
          title: (r.titleName && r.titleName !== '새내기 쾌변러') ? r.titleName : '보유 칭호 없음',
          titleColor: Number(r.rank) === 1 ? '#E8A838' : Number(r.rank) === 2 ? '#B0B8B4' : Number(r.rank) === 3 ? '#CD7C4A' : '#52b788',
          titleBg: Number(r.rank) === 1 ? 'rgba(232,168,56,0.12)' : Number(r.rank) === 2 ? 'rgba(176,184,180,0.12)' : Number(r.rank) === 3 ? 'rgba(205,124,74,0.12)' : 'rgba(82,183,136,0.1)',
          level: Number(r.level || 0),
          score: Number(r.score || 0),
          scoreLabel: '점',
          change: 0,
          items: (r.equippedItems || []).map((item) => ({
            icon: item.icon || '🎁',
            name: item.name || '아이템',
            type: item.type || '장식'
          })),
          effectEmoji: (r.equippedItems || []).find((item) => item.type === 'EFFECT')?.icon ?? undefined,
        }))
    : [];

  const myRankData = useMemo(() => {
    if (!data) return null;
    const rawMyRank = data.myRank;
    
    if (!rawMyRank) {
      if (!user) return null;
      return {
        rank: '-',
        score: 0,
        nick: user.nickname || '나',
        lv: user.level || 1,
        needed: 1,
        top: 100,
        userId: user.id,
        equippedAvatarUrl: user.equippedAvatarUrl,
      };
    }

    const myRank = Number(rawMyRank.rank || 0);
    const myScore = Number(rawMyRank.score || 0);
    const totalRankers = users.length;
    const topPercent = totalRankers > 0 ? Math.ceil((myRank / totalRankers) * 100) : 0;
    
    return {
      rank: myRank,
      nick: rawMyRank.nickname || '나',
      lv: rawMyRank.level || 1,
      score: myScore,
      top: topPercent,
      needed: 5,
      userId: rawMyRank.userId,
      equippedAvatarUrl: rawMyRank.equippedAvatarUrl,
    };
  }, [isDataValid, data, user, users.length]);

  const currentTab = TAB_CONFIG.find(t => t.key === tab)!;

  const handleSelect = useCallback((user: RankUser) => {
    setSelectedUser(user);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F8FAF9' }}>
        <Navbar openAuth={openAuth} />

        <div className="relative overflow-hidden" style={{ background: '#F8FAF9' }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,168,56,0.12) 0%, transparent 70%)',
            }}
          />

          <section className="relative z-10 pt-28 sm:pt-32 pb-24 sm:pb-40 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-10"
              >
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6"
                  style={{ background: 'rgba(232,168,56,0.1)', color: '#E8A838', border: '1px solid rgba(232,168,56,0.2)' }}
                >
                  <Trophy size={14} /> 명예의 전당
                </span>
                <h1
                  className="font-black leading-tight"
                  style={{ fontSize: 'clamp(36px, 8vw, 64px)', color: '#1A2B27', letterSpacing: '-0.04em' }}
                >
                  오늘의 쾌변
                  <br />
                  <span style={{
                    background: 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    챔피언
                  </span>
                </h1>
              </motion.div>

              <div
                className="flex rounded-2xl p-1 mb-12"
                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}
              >
                {TAB_CONFIG.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative"
                    style={{ color: tab === t.key ? '#fff' : 'rgba(0,0,0,0.4)' }}
                  >
                    {tab === t.key && (
                      <motion.div
                        layoutId="tabBg"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: '#E8A838', boxShadow: '0 4px 12px rgba(232,168,56,0.3)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {t.icon}
                      <span className="leading-none">{t.label}</span>
                    </span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="text-center text-sm mb-6"
                  style={{ color: 'rgba(0,0,0,0.4)' }}
                >
                  {currentTab.desc}
                </motion.p>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {tab === 'local' && !regionName ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative flex flex-col items-center justify-center py-16 px-6 rounded-[40px] overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(27,67,50,0.05) 0%, rgba(232,168,56,0.08) 100%)',
                        border: '2px solid rgba(27,67,50,0.1)',
                      }}
                    >
                      {/* 배경 장식 */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8A838] opacity-5 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#1B4332] opacity-5 rounded-full blur-3xl" />

                      {/* 메인 아이콘 */}
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="relative mb-6 z-10"
                      >
                        <div className="relative flex items-center justify-center">
                          {/* 배경 원 */}
                          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-[#1B4332]/10 to-[#E8A838]/10 blur-xl" />
                          {/* 아이콘 컨테이너 */}
                          <div className="relative w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-[#E8A838]/20">
                            <MapPin size={40} className="text-[#1B4332]" strokeWidth={2.5} />
                          </div>
                          {/* 반짝이는 별 */}
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute -top-2 -right-2"
                          >
                            <Star size={20} fill="#E8A838" className="text-[#E8A838]" />
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* 타이틀 */}
                      <h3 className="text-xl sm:text-2xl font-black mb-3 relative z-10 leading-tight text-center"
                        style={{
                          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #E8A838 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        📍 아직 소속된 지역이 없습니다!
                      </h3>

                      {/* 설명 */}
                      <p className="text-sm sm:text-base text-gray-600 text-center mb-2 max-w-md relative z-10 leading-relaxed px-4">
                        지도에서 <span className="font-bold text-[#1B4332]">화장실을 1회 이상 방문 후 인증</span>을 완료하면,<br className="hidden sm:block" />
                        파악된 현재 지역의 동네 랭킹을 확인할 수 있어요.
                      </p>
                      <p className="text-xs text-gray-400 mb-8 relative z-10">
                        💪 지금 바로 시작하고 1등에 도전하세요!
                      </p>

                      {/* CTA 버튼 */}
                      <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                        <WaveButtonComponent
                          onClick={() => window.location.href = '/map'}
                          variant="primary"
                          size="lg"
                          className="shadow-xl"
                        >
                          <span className="flex items-center gap-2">
                            <MapPin size={18} />
                            방문 인증하러 가기
                          </span>
                        </WaveButtonComponent>
                      </div>

                      {/* 하단 안내 */}
                      <div className="mt-8 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-100 relative z-10">
                        <p className="text-xs text-gray-500 text-center">
                          💡 <span className="font-bold">TIP:</span> 지도에서 가까운 화장실을 찾아 방문 인증을 완료하면<br className="hidden sm:block" />
                          자동으로 우리 동네 랭킹에 등록됩니다
                        </p>
                      </div>
                    </motion.div>
                  ) : users.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-white/50 rounded-3xl border border-gray-100">
                      <Trophy size={48} className="text-gray-300 mb-4" />
                      <h3 className="text-xl font-black text-gray-800 mb-2">아직 랭킹 데이터가 없습니다</h3>
                      <p className="text-sm text-gray-500 text-center">
                        첫 번째 랭커가 되어보세요!
                      </p>
                    </div>
                  ) : (
                    <Podium users={users.slice(0, 3)} onSelect={handleSelect} />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {[
                  {
                    label: '활성 사용자',
                    value: (data && typeof data.activeUserCount === 'number')
                      ? data.activeUserCount.toLocaleString()
                      : '0',
                    unit: '+'
                  },
                  {
                    label: '내 현재 순위',
                    value: myRankData ? myRankData.rank.toString() : '-',
                    unit: '위'
                  },
                  {
                    label: '상위권 도전',
                    value: (myRankData && typeof myRankData.rank === 'number' && myRankData.rank > 10)
                      ? (myRankData.rank - 10).toString()
                      : '0',
                    unit: '계단'
                  },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="rounded-3xl py-4 px-6 text-center"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 24px rgba(27,67,50,0.04)' }}
                  >
                    <p className="font-black text-2xl sm:text-4xl" style={{ color: '#E8A838', letterSpacing: '-0.04em' }}>
                      {s.value}<span className="text-sm sm:text-base font-bold ml-0.5">{s.unit}</span>
                    </p>
                    <p className="text-sm mt-1.5 font-bold" style={{ color: 'rgba(0,0,0,0.4)' }}>{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 mb-4">
                {myRankData && <MyRankBar data={myRankData} />}
              </div>
            </div>
          </section>

          <WaveDivider fill="#eef5f0" />
        </div>

        <div className="relative overflow-hidden" style={{ background: '#eef5f0' }}>
          <section className="pt-16 pb-40 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-black text-3xl text-[#1A2B27]" style={{ letterSpacing: '-0.03em' }}>
                  TOP 10
                </h2>
                <span className="text-base" style={{ color: 'rgba(0,0,0,0.3)' }}>
                  실시간 반영
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[400px]"
                >
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="text-emerald-600"
                      >
                        <Activity size={32} />
                      </motion.div>
                      <p className="text-sm font-bold text-gray-400">랭킹 데이터를 불러오는 중...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <p className="text-sm font-bold text-red-400">데이터를 불러오지 못했습니다.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-500"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : tab === 'local' && !regionName ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-white/50 rounded-3xl border border-gray-100">
                      <MapPin size={48} className="text-gray-300 mb-4" />
                      <h3 className="text-xl font-black text-gray-800 mb-2">지역 인증이 필요합니다</h3>
                      <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed">
                        현재 소속된 지역이 없습니다. 화장실 1회 이상 방문 인증 후 랭킹에 참여해보세요!
                      </p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-white/50 rounded-3xl border border-gray-100">
                      <Trophy size={48} className="text-gray-300 mb-4" />
                      <h3 className="text-xl font-black text-gray-800 mb-2">데이터가 없습니다</h3>
                      <p className="text-sm text-gray-500 text-center">
                        이 지역의 첫 번째 랭커가 되어보세요!
                      </p>
                    </div>
                  ) : (
                    users.map((user, i) => (
                      <RankItem
                        key={`${tab}-${user.rank}`}
                        user={user}
                        index={i}
                        onSelect={handleSelect}
                      />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
          <WaveDivider fill="#111e18" />
        </div>

        {selectedUser && (
          <ItemPopup user={selectedUser} onClose={() => setSelectedUser(null)} openAuth={openAuth} />
        )}
        <Footer />
    </div>
  );
}
