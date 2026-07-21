import { ChevronLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type { ItemType } from '../../types/admin';
import { parseDicebearUrl } from '../../utils/avatar';
import type { AdminTab } from './adminCommons';

export interface AddItemViewProps {
  setActiveTab: (tab: AdminTab) => void;
}

export const AddItemView = ({ setActiveTab }: AddItemViewProps) => {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemType, setItemType] = useState<ItemType>('AVATAR');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [discountPrice, setDiscountPrice] = useState<number | null>(null);
  const [dicebearStyle, setDicebearStyle] = useState('funEmoji');
  const [dicebearSeed, setDicebearSeed] = useState('golden-crown');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!itemName.trim()) newErrors.itemName = '아이템 명칭을 입력해주세요.';
    if (!itemDescription.trim()) newErrors.itemDescription = '아이템 설명을 입력해주세요.';
    if (itemPrice === '' || itemPrice < 0) {
      newErrors.itemPrice = '가격을 0 이상으로 입력해주세요.';
    }
    if (itemType === 'EFFECT' && !itemImageUrl.trim()) {
      newErrors.itemImageUrl = '이펙트 이모지를 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('필수 입력 항목을 확인해주세요.');
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      await api.post('/admin/shop/items', {
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
      alert('아이템이 등록되었습니다.');
      setItemName('');
      setItemDescription('');
      setItemType('AVATAR');
      setItemPrice('');
      setDiscountPrice(null);
      setItemImageUrl('');
      setActiveTab('store');
    } catch (error) {
      console.error('아이템 등록 실패:', error);
      alert('아이템 등록에 실패했습니다.');
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
        <h3 className="text-2xl font-black text-black">신규 상점 아이템 등록</h3>
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
                  onChange={(e) => {
                    setItemImageUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.itemImageUrl;
                        return next;
                      });
                    }
                  }}
                  required
                  aria-required="true"
                  className={`w-full bg-white border px-4 py-2 rounded-xl text-center text-2xl placeholder:text-black/40 focus:ring-4 ring-[#1B4332]/10 outline-none transition-all ${
                    errors.itemImageUrl ? 'border-red-500 ring-red-500/10' : 'border-black/10'
                  }`}
                  placeholder="🔥"
                  maxLength={2}
                />
                {errors.itemImageUrl && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.itemImageUrl}</p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-4">
                <img
                  src={parseDicebearUrl(`dicebear:${dicebearStyle}:${dicebearSeed}`, 1, 'AVATAR')}
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
                  onChange={(e) => {
                    setItemName(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.itemName;
                        return next;
                      });
                    }
                  }}
                  required
                  aria-required="true"
                  className={`w-full bg-black/[0.02] border px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40 ${
                    errors.itemName ? 'border-red-500 ring-red-500/10' : 'border-black/5'
                  }`}
                  placeholder="예: 황금 변기 칭호"
                />
                {errors.itemName && (
                  <p className="text-red-500 text-xs mt-1 font-bold">{errors.itemName}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                    가격 (POOP POINT) *
                  </label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setItemPrice(val);
                      if (val !== '' && val >= 0) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.itemPrice;
                          return next;
                        });
                      }
                    }}
                    required
                    aria-required="true"
                    className={`w-full bg-black/[0.02] border px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-4 ring-[#1B4332]/10 outline-none transition-all ${
                      errors.itemPrice ? 'border-red-500 ring-red-500/10' : 'border-black/5'
                    }`}
                    placeholder="5000"
                    min="0"
                  />
                  {errors.itemPrice && (
                    <p className="text-red-500 text-xs mt-1 font-bold">{errors.itemPrice}</p>
                  )}
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
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">
                  아이템 설명 *
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => {
                    setItemDescription(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.itemDescription;
                        return next;
                      });
                    }
                  }}
                  required
                  aria-required="true"
                  className={`w-full bg-black/[0.02] border px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none text-black placeholder:text-black/40 focus:ring-4 ring-[#1B4332]/10 outline-none transition-all ${
                    errors.itemDescription ? 'border-red-500 ring-red-500/10' : 'border-black/5'
                  }`}
                  placeholder="아이템에 대한 상세 설명을 입력하세요..."
                />
                {errors.itemDescription && (
                  <p className="text-red-500 text-xs mt-1 font-bold">{errors.itemDescription}</p>
                )}
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '등록 중...' : '등록 완료'}
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
export default AddItemView;
