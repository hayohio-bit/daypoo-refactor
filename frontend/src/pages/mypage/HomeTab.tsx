import { loadTossPayments } from '@tosspayments/payment-sdk';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CountUp } from '../../components/common/CountUp';
import { DepthDeckCarousel, type DeckCard } from '../../components/common/DepthDeckCarousel';
import { api } from '../../services/apiClient';
import type { UserResponse } from '../../types/api';
import { generateItemAvatar, isEmoji, parseDicebearUrl } from '../../utils/avatar';
import { type AvatarItem, type TabKey } from './myPageCommons';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  },
});

export interface HomeTabProps {
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
}

export const HomeTab = ({
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
}: HomeTabProps) => {
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

  useEffect(() => {
    setCurrentPage(0);
  }, [shopTab, categoryFilter]);

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
      if (!preview.inventoryId) {
        alert('아이템 정보가 올바르지 않습니다.');
        return;
      }

      try {
        await api.post(`/shop/inventory/${preview.inventoryId}/toggle`);

        if (preview.rawType === 'AVATAR') {
          setEquipped(preview);
        }

        fetchShopData();
        refreshUser();

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setPreview(null);
      } catch (err: any) {
        console.error('아이템 장착 실패:', err);
        alert(err.message || '아이템 장착에 실패했습니다.');
      }
    } else {
      const userPoints = user?.points ?? 0;
      const itemPrice = preview.discountPrice ?? preview.price ?? 0;

      if (userPoints >= itemPrice) {
        try {
          await api.post('/shop/purchase', { itemId: preview.id });
          await refreshUser();
          await fetchShopData();

          const response = await api.get<any[]>('/shop/inventory');
          const newInventoryItem = Array.isArray(response)
            ? response.find((inv) => String(inv.itemId) === preview.id)
            : null;

          if (newInventoryItem?.id) {
            await api.post(`/shop/inventory/${newInventoryItem.id}/toggle`);
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
      <motion.div
        variants={fadeUp(0)}
        className="bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px]"
      >
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
                          const isSelected = preview?.id === item.id;
                          const color = item.owned ? '#2D6A4F' : '#E8A838';

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
                              }`}
                              style={{ background: '#fff' }}
                            >
                              <div className="aspect-square bg-black/[0.02] flex items-center justify-center relative overflow-hidden p-4">
                                <div
                                  className="w-12 h-12 rounded-full blur-2xl opacity-20 absolute"
                                  style={{ background: color }}
                                />
                                {item.imageUrl &&
                                (isEmoji(item.imageUrl) ||
                                  (!item.imageUrl.includes(':') &&
                                    !item.imageUrl.startsWith('http') &&
                                    !item.imageUrl.startsWith('/'))) ? (
                                  <span className="text-6xl transition-transform group-hover:scale-110 duration-500 select-none leading-none">
                                    {item.imageUrl}
                                  </span>
                                ) : (
                                  <img
                                    src={parseDicebearUrl(
                                      item.imageUrl || '',
                                      item.id,
                                      item.rawType || 'AVATAR',
                                    )}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                  />
                                )}
                              </div>
                              <div className="p-4">
                                <p className="font-black text-sm text-[#1A2B27] truncate">
                                  {item.name}
                                </p>
                                <div className="mt-1 flex items-end justify-between">
                                  {item.owned ? (
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                      보유 중
                                    </span>
                                  ) : item.discountPrice != null ? (
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-black/30 line-through">
                                        {item.price?.toLocaleString()}P
                                      </span>
                                      <span className="text-xs font-black text-[#E8A838]">
                                        {item.discountPrice.toLocaleString()}P
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-black text-black/60">
                                      {item.price?.toLocaleString()}P
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>

                    {items.length > itemsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className="p-2 rounded-xl border border-gray-200 disabled:opacity-30"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <span className="text-xs font-bold text-black/40">
                          {currentPage + 1} / {Math.ceil(items.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min(Math.ceil(items.length / itemsPerPage) - 1, p + 1),
                            )
                          }
                          disabled={currentPage >= Math.ceil(items.length / itemsPerPage) - 1}
                          className="p-2 rounded-xl border border-gray-200 disabled:opacity-30"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-20 text-center text-black/30 font-medium">
                    해당 카테고리에 아이템이 없습니다.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* 하단 미리보기 서브패널 (장착/구매 바인딩) */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-gray-100 p-6 sm:p-10 bg-emerald-50/20 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[20px] bg-white border border-gray-100 flex items-center justify-center text-3xl shadow-sm">
                {preview.imageUrl && isEmoji(preview.imageUrl) ? (
                  <span className="select-none leading-none">{preview.imageUrl}</span>
                ) : (
                  <img
                    src={parseDicebearUrl(
                      preview.imageUrl || '',
                      preview.id,
                      preview.rawType || 'AVATAR',
                    )}
                    alt={preview.name}
                    className="w-full h-full object-cover rounded-[18px]"
                  />
                )}
              </div>
              <div>
                <h4 className="font-black text-[#1A2B27]">{preview.name}</h4>
                <p className="text-xs text-black/40 mt-1 font-bold">
                  {preview.owned
                    ? `${preview.type} 장착 가능`
                    : `구매에 ${(
                        preview.discountPrice ??
                        preview.price ??
                        0
                      ).toLocaleString()}P가 차감됩니다.`}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-[#1B4332] text-white rounded-[18px] text-sm font-black shadow-xl shadow-green-900/10"
              >
                {preview.owned ? '장착하기' : '구매 후 장착'}
              </button>
              <button
                onClick={() => setPreview(null)}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-gray-100 text-gray-500 rounded-[18px] text-sm font-bold"
              >
                취소
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 결제 충전 모달 */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-[#1A2B27] mb-4">포인트 충전</h3>
              <p className="text-sm text-black/50 font-bold mb-6">
                보유 포인트가 부족합니다. 포인트를 충전하시겠습니까?
              </p>

              <div className="space-y-4 mb-8">
                {[3000, 5000, 10000, 20000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setChargeAmount(amt)}
                    className={`w-full py-4 rounded-2xl border-2 font-black text-sm flex justify-between px-6 transition-all ${
                      chargeAmount === amt
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700'
                        : 'border-gray-100 text-black/50 hover:bg-gray-50'
                    }`}
                  >
                    <span>{amt.toLocaleString()} 포인트 충전</span>
                    <span>{amt.toLocaleString()}원</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleTossPayment}
                  className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black text-sm shadow-xl"
                >
                  결제하기
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default HomeTab;
