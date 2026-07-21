import { ChevronLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type { ItemResponse, ItemType } from '../../types/admin';
import { parseDicebearUrl } from '../../utils/avatar';
import type { AdminTab } from './adminCommons';

export interface EditItemViewProps {
  setActiveTab: (tab: AdminTab) => void;
  editingItem: ItemResponse;
}

export const EditItemView = ({ setActiveTab, editingItem }: EditItemViewProps) => {
  const [itemName, setItemName] = useState(editingItem.name);
  const [itemDescription, setItemDescription] = useState(editingItem.description);
  const [itemType, setItemType] = useState<ItemType>(editingItem.type);
  const [itemPrice, setItemPrice] = useState<number | ''>(editingItem.price);
  const [discountPrice, setDiscountPrice] = useState<number | null>(
    editingItem.discountPrice ?? null,
  );
  const [itemImageUrl, setItemImageUrl] = useState(editingItem.imageUrl || '');

  const isDicebear = editingItem.imageUrl?.startsWith('dicebear:');
  const dParts = isDicebear ? editingItem.imageUrl?.split(':') || [] : [];
  const [dicebearStyle, setDicebearStyle] = useState(dParts[1] || 'funEmoji');
  const [dicebearSeed, setDicebearSeed] = useState(dParts[2] || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      alert('아이템 명칭을 입력해주세요.');
      return;
    }
    if (!itemDescription.trim()) {
      alert('아이템 설명을 입력해주세요.');
      return;
    }
    if (itemPrice === '' || itemPrice < 0) {
      alert('가격은 0 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/admin/shop/items/${editingItem.id}`, {
        name: itemName,
        description: itemDescription,
        type: itemType,
        price: itemPrice,
        discountPrice: discountPrice,
        imageUrl:
          itemType === 'AVATAR'
            ? `dicebear:${dicebearStyle}:${dicebearSeed}`
            : itemImageUrl || null,
      });
      alert('아이템이 수정되었습니다.');
      setActiveTab('store');
    } catch (error) {
      console.error('아이템 수정 실패:', error);
      alert('아이템 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab('store')}
          aria-label="상점 목록으로 돌아가기"
          className="p-2 rounded-xl hover:bg-black/5 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-2xl font-black text-black">아이템 수정</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <GlassCard className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-black/10 bg-black/[0.01]">
            {itemType === 'EFFECT' ? (
              <>
                <span className="text-7xl mb-4 select-none">{itemImageUrl || '✨'}</span>
                <p className="text-xs font-black text-black/30 mb-3">이펙트 이모지 *</p>
                <input
                  type="text"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-center text-2xl placeholder:text-black/40"
                  placeholder="🔥"
                  maxLength={2}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-4">
                <img
                  src={parseDicebearUrl(
                    `dicebear:${dicebearStyle}:${dicebearSeed}`,
                    editingItem.id,
                    'AVATAR',
                  )}
                  alt="preview"
                  className="w-32 h-32 mb-4"
                />
                <button
                  onClick={() => setDicebearSeed(Math.random().toString(36).substring(7))}
                  className="px-4 py-2 bg-[#E8A838]/10 text-[#E8A838] rounded-xl font-bold flex items-center gap-2 mb-4 hover:bg-[#E8A838]/20 transition-colors text-xs"
                >
                  <Sparkles size={16} /> 랜덤 생성
                </button>
                <div className="w-full space-y-2">
                  <select
                    value={dicebearStyle}
                    onChange={(e) => setDicebearStyle(e.target.value)}
                    className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-xs font-bold text-black"
                  >
                    <option value="funEmoji">funEmoji (기본)</option>
                    <option value="avataaars">avataaars (사람)</option>
                    <option value="bottts">bottts (로봇)</option>
                    <option value="lorelei">lorelei (만화)</option>
                    <option value="pixelArt">pixelArt (픽셀)</option>
                  </select>
                  <input
                    type="text"
                    value={dicebearSeed}
                    onChange={(e) => setDicebearSeed(e.target.value)}
                    className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-xs font-bold text-black placeholder:text-black/40"
                    placeholder="시드 단어 입력..."
                  />
                </div>
              </div>
            )}
          </GlassCard>
        </div>
        <div className="md:col-span-2 space-y-6">
          <GlassCard>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  아이템 명칭 *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40"
                  placeholder="예: 황금 변기 칭호"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    가격 (POOP POINT) *
                  </label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) =>
                      setItemPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    할인가 (선택)
                  </label>
                  <input
                    type="number"
                    value={discountPrice === null ? '' : discountPrice}
                    onChange={(e) =>
                      setDiscountPrice(e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="미입력 시 할인 없음"
                    min="0"
                  />
                  {discountPrice !== null &&
                    itemPrice !== '' &&
                    discountPrice < Number(itemPrice) && (
                      <p className="text-xs text-red-500 font-bold mt-1">
                        -{Math.round((1 - discountPrice / Number(itemPrice)) * 100)}% 할인 적용
                      </p>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    카테고리 *
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as ItemType)}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black"
                  >
                    <option value="AVATAR">아바타</option>
                    <option value="EFFECT">효과</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  아이템 설명 *
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none text-black placeholder:text-black/40"
                  placeholder="아이템에 대한 상세 설명을 입력하세요..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '수정 중...' : '수정 완료'}
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black hover:bg-black/10 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
export default EditItemView;
