import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { DepthDeckCarousel, type DeckCard } from '../../components/common/DepthDeckCarousel';
import { api } from '../../services/apiClient';
import type { UserResponse } from '../../types/api';
import { isEmoji, parseDicebearUrl } from '../../utils/avatar';
import { type AvatarItem, AvatarEffect } from './myPageCommons';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  },
});

export interface CollectionTabProps {
  equipped: AvatarItem | null;
  setEquipped: (i: AvatarItem | null) => void;
  equippedEffect: AvatarItem | null;
  setEquippedEffect: (i: AvatarItem | null) => void;
  user: UserResponse | null;
  avatarItems: AvatarItem[];
  refreshUser: () => Promise<void>;
  fetchShopData: () => Promise<void>;
}

export const CollectionTab = ({
  equipped,
  setEquipped,
  equippedEffect,
  setEquippedEffect,
  user,
  avatarItems,
  refreshUser,
  fetchShopData,
}: CollectionTabProps) => {
  const [selectedCategory, setSelectedCategory] = useState<'AVATAR' | 'EFFECT'>('AVATAR');
  const [preview, setPreview] = useState<AvatarItem | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredItems = (avatarItems || []).filter(
    (i) => i.owned && i.rawType === selectedCategory,
  );

  const deckCards: DeckCard[] = filteredItems.map((item) => ({
    id: item.id,
    emoji: item.emoji,
    label: item.name,
    sublabel: item.isEquipped ? '착용 중' : '보유',
    accent: '#2D6A4F',
    selected: preview?.id === item.id || (!preview && item.isEquipped),
  }));

  const handleSelect = (id: string) => {
    const item = filteredItems.find((i) => i.id === id);
    if (item) setPreview(item);
  };

  const handleEquipToggle = async () => {
    const target = preview || filteredItems.find((i) => i.isEquipped);
    if (!target) return;

    if (!target.inventoryId) {
      alert('아이템 정보가 올바르지 않습니다.');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/shop/inventory/${target.inventoryId}/toggle`);

      if (selectedCategory === 'AVATAR') {
        if (target.isEquipped) {
          setEquipped(null);
        } else {
          setEquipped(target);
        }
      } else {
        if (target.isEquipped) {
          setEquippedEffect(null);
        } else {
          setEquippedEffect(target);
        }
      }

      await fetchShopData();
      await refreshUser();
      alert(target.isEquipped ? '아이템을 해제했습니다.' : '아이템을 장착했습니다.');
      setPreview(null);
    } catch (err: any) {
      console.error('아이템 상태 변경 실패:', err);
      alert(err.message || '요청 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const activeEquipped = selectedCategory === 'AVATAR' ? equipped : equippedEffect;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-10 py-4"
    >
      {/* 카테고리 듀얼 컨트롤 */}
      <motion.div variants={fadeUp(0)} className="flex justify-center">
        <div className="flex bg-gray-50 border p-1.5 rounded-[24px] shadow-inner">
          {(['AVATAR', 'EFFECT'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPreview(null);
              }}
              className="relative px-8 py-3.5 rounded-[18px] text-sm font-black transition-all"
              style={{ color: selectedCategory === cat ? '#ffffff' : 'rgba(26,43,39,0.4)' }}
            >
              {selectedCategory === cat && (
                <motion.div
                  layoutId="colTab"
                  className="absolute inset-0 rounded-[18px]"
                  style={{ background: '#1B4332' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {cat === 'AVATAR' ? '아바타 쇼룸' : '오라 효과룸'}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 3D Carousel Stage */}
      <motion.div
        variants={fadeUp(0.08)}
        className="bg-white rounded-[40px] border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[380px] shadow-sm relative overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-[#1B4332]/5 rounded-full blur-3xl pointer-events-none" />
        
        {filteredItems.length > 0 ? (
          <DepthDeckCarousel cards={deckCards} onSelect={handleSelect} />
        ) : (
          <div className="text-center py-10 space-y-4">
            <span className="text-5xl block">🔒</span>
            <p className="text-sm font-black text-black/30">수집한 아이템이 없습니다.</p>
            <p className="text-xs font-bold text-black/20">상점에서 다양한 상품을 구매해보세요!</p>
          </div>
        )}
      </motion.div>

      {/* 장착 제어 하단 패널 */}
      <AnimatePresence mode="wait">
        {(preview || activeEquipped) && filteredItems.length > 0 && (
          <motion.div
            key={preview?.id || activeEquipped?.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-5">
              <div className="relative w-18 h-18 rounded-[24px] bg-black/[0.02] flex items-center justify-center text-4xl shadow-inner border flex-shrink-0">
                {preview ? (
                  preview.imageUrl && isEmoji(preview.imageUrl) ? (
                    <span className="select-none leading-none">{preview.imageUrl}</span>
                  ) : (
                    <img
                      src={parseDicebearUrl(
                        preview.imageUrl || '',
                        preview.id,
                        preview.rawType || 'AVATAR',
                      )}
                      alt={preview.name}
                      className="w-full h-full object-cover rounded-[22px]"
                    />
                  )
                ) : activeEquipped ? (
                  activeEquipped.imageUrl && isEmoji(activeEquipped.imageUrl) ? (
                    <span className="select-none leading-none">{activeEquipped.imageUrl}</span>
                  ) : (
                    <img
                      src={parseDicebearUrl(
                        activeEquipped.imageUrl || '',
                        activeEquipped.id,
                        activeEquipped.rawType || 'AVATAR',
                      )}
                      alt={activeEquipped.name}
                      className="w-full h-full object-cover rounded-[22px]"
                    />
                  )
                ) : (
                  '❓'
                )}
                {/* 오라 효과룸일 때 오라 미리보기 */}
                {selectedCategory === 'EFFECT' && (preview?.emoji || activeEquipped?.emoji) && (
                  <AvatarEffect emoji={preview?.emoji || activeEquipped?.emoji || ''} size={72} />
                )}
              </div>
              <div>
                <h4 className="text-lg font-black text-black">
                  {preview?.name || activeEquipped?.name}
                </h4>
                <p className="text-xs font-bold text-black/40 mt-1">
                  {preview
                    ? preview.isEquipped
                      ? '현재 이 아이템을 장착하고 있습니다.'
                      : '이 수집품을 새로 장착합니다.'
                    : '이 아이템이 활성화되어 있습니다.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleEquipToggle}
                disabled={saving}
                className="flex-1 md:flex-none px-8 py-3.5 bg-[#1B4332] text-white rounded-2xl text-xs font-black shadow-lg shadow-green-900/10 disabled:opacity-50"
              >
                {saving
                  ? '적용 중...'
                  : preview
                  ? preview.isEquipped
                    ? '장착 해제'
                    : '장착하기'
                  : '장착 해제'}
              </button>
              {preview && (
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 md:flex-none px-6 py-3.5 bg-gray-50 text-gray-400 rounded-2xl text-xs font-bold border"
                >
                  취소
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default CollectionTab;
