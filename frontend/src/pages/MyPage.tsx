import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountUp } from '../components/common/CountUp';
import { KnockoutWobble } from '../components/common/KnockoutWobble';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import type { UserResponse } from '../types/api';
import {
  generateProfileAvatar,
  isEmoji,
  parseDicebearUrl,
} from '../utils/avatar';

// ── 분할된 서브 탭 임포트 ───────────────────────────────────────────────
import {
  AvatarEffect,
  type AvatarItem,
  type TabKey,
} from './mypage/myPageCommons';
import { HomeTab } from './mypage/HomeTab';
import { CollectionTab } from './mypage/CollectionTab';
import { ReportTab } from './mypage/ReportTab';
import { SettingsTab } from './mypage/SettingsTab';

// ── 애니메이션 프리셋 ──────────────────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  },
});

// ── 히어로 배너 (상단 프로필) ────────────────────────────────────────────
interface HeroBannerProps {
  equippedItem: AvatarItem | null;
  equippedEffect: AvatarItem | null;
  onAvatarClick: () => void;
  user: UserResponse | null;
  records?: any[];
}

function HeroBanner({
  equippedItem,
  equippedEffect,
  onAvatarClick,
  user,
  records = [],
}: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
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
                          equippedItem.imageUrl || '',
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

              <motion.div variants={fadeUp(0.1)} className="mb-1">
                <KnockoutWobble
                  text={user?.nickname || '익명의 쾌변러'}
                  gradient="#1B4332"
                  fontSize="fontSize"
                  style={{ fontSize: 'clamp(22px, 5vw, 36px)' }}
                  fontWeight={900}
                  wobbleDuration={500}
                />
              </motion.div>

              <motion.div variants={fadeUp(0.15)} className="flex items-center gap-3 mt-3">
                {(() => {
                  const level = user?.level || 1;
                  const currentExp = user?.exp || 0;
                  const expForNextLevel = level * 100;
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

          {/* 실시간 요약 통계 */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="hidden sm:flex flex-col gap-2 pb-1"
          >
            {(() => {
              const totalAuthCount = user?.totalAuthCount || records.length;
              const totalVisitCount =
                user?.totalVisitCount || new Set(records.map((r: any) => r.toiletId)).size;

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

      {/* 하단 웨이브 장식 */}
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

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────

export function MyPage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout, deleteMe, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<TabKey>('home');

  // 상점 데이터 상태 관리
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>([]);
  const [equipped, setEquipped] = useState<AvatarItem | null>(null);
  const [equippedEffect, setEquippedEffect] = useState<AvatarItem | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // 구독 플랜 명칭 파싱
  const isPro = user?.isPro ?? false;
  const membershipName =
    user?.subscription?.plan === 'PREMIUM'
      ? 'PREMIUM'
      : user?.subscription?.plan === 'PRO'
      ? 'PRO'
      : 'FREE';

  // 상점 데이터 호출 API
  const fetchShopData = useCallback(async () => {
    try {
      const [shopData, inventoryData] = await Promise.all([
        api.get<any[]>('/shop/items'),
        api.get<any[]>('/shop/inventory'),
      ]);

      const inventoryMap = new Map<string, any>();
      if (Array.isArray(inventoryData)) {
        inventoryData.forEach((inv) => {
          inventoryMap.set(String(inv.itemId), inv);
        });
      }

      const mergedItems: AvatarItem[] = (shopData || []).map((item) => {
        const invItem = inventoryMap.get(String(item.id));
        const owned = !!invItem;
        const isEquipped = invItem?.equipped ?? false;

        const avatarItem: AvatarItem = {
          id: String(item.id),
          name: item.name,
          emoji: item.imageUrl && isEmoji(item.imageUrl) ? item.imageUrl : '💩',
          imageUrl: item.imageUrl || undefined,
          type: item.type === 'EFFECT' ? '이펙트' : '헤드',
          rawType: item.type,
          owned,
          price: item.price,
          discountPrice: item.discountPrice,
          inventoryId: invItem?.id ? String(invItem.id) : undefined,
          isEquipped,
        };

        if (isEquipped) {
          if (item.type === 'AVATAR') {
            setEquipped(avatarItem);
          } else if (item.type === 'EFFECT') {
            setEquippedEffect(avatarItem);
          }
        }

        return avatarItem;
      });

      setAvatarItems(mergedItems);
    } catch (err) {
      console.error('상점 데이터 조회 실패:', err);
    }
  }, []);

  // 전체 데이터 로드
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const loadAll = async () => {
      setLoadingData(true);
      try {
        await Promise.all([fetchShopData(), api.get<any[]>('/records/me').then(setRecords)]);
      } catch (err) {
        console.error('마이페이지 데이터 조회 실패:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadAll();
  }, [authLoading, user, navigate, fetchShopData]);

  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw size={40} className="animate-spin text-[#1B4332] opacity-20" />
        <p className="text-sm font-black text-black/20 uppercase tracking-[0.3em]">
          Loading profile...
        </p>
      </div>
    );
  }

  // 소셜 로그인 회원의 닉네임 설정 권장 여부
  const needsNicknameSetup =
    user?.nickname &&
    (user.nickname.startsWith('user_') || user.nickname.startsWith('kakaouser_'));

  return (
    <div
      className="min-h-screen overflow-x-hidden font-['Pretendard']"
      style={{ background: '#f8faf9' }}
    >
      <HeroBanner
        equippedItem={equipped}
        equippedEffect={equippedEffect}
        onAvatarClick={() => setTab('collection')}
        user={user}
        records={records}
      />

      <TabBar active={tab} onChange={setTab} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {needsNicknameSetup && (
          <NicknameSetupBanner onSettingsClick={() => setTab('settings')} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {tab === 'home' && (
              <HomeTab
                equipped={equipped}
                setEquipped={setEquipped}
                user={user}
                avatarItems={avatarItems}
                setAvatarItems={setAvatarItems}
                refreshUser={refreshUser}
                fetchShopData={fetchShopData}
                onTabChange={setTab}
                records={records}
              />
            )}
            {tab === 'collection' && (
              <CollectionTab
                equipped={equipped}
                setEquipped={setEquipped}
                equippedEffect={equippedEffect}
                setEquippedEffect={setEquippedEffect}
                user={user}
                avatarItems={avatarItems}
                refreshUser={refreshUser}
                fetchShopData={fetchShopData}
              />
            )}
            {tab === 'report' && (
              <ReportTab isPro={isPro} membershipName={membershipName} />
            )}
            {tab === 'settings' && (
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
    </div>
  );
}
export default MyPage;
