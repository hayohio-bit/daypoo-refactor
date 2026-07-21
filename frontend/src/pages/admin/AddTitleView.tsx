import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type { AchievementType, AdminTitleResponse } from '../../types/admin';
import type { AdminTab } from './adminCommons';
import { ACHIEVEMENT_LABELS } from './TitleManagementView';

export interface AddTitleViewProps {
  setActiveTab: (tab: AdminTab) => void;
  editingTitle: AdminTitleResponse | null;
}

export const AddTitleView = ({ setActiveTab, editingTitle }: AddTitleViewProps) => {
  const [name, setName] = useState(editingTitle?.name || '');
  const [description, setDescription] = useState(editingTitle?.description || '');
  const [imageUrl, setImageUrl] = useState(editingTitle?.imageUrl || '');
  const [type, setType] = useState<AchievementType>(
    editingTitle?.achievementType || 'TOTAL_RECORDS',
  );
  const [threshold, setThreshold] = useState<number>(editingTitle?.achievementThreshold || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '칭호 명칭을 입력해주세요.';
    if (!description.trim()) newErrors.description = '칭호 설명을 입력해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('필수 입력 항목을 확인해주세요.');
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description,
        imageUrl,
        achievementType: type,
        achievementThreshold: threshold,
      };

      if (editingTitle) {
        await api.put(`/admin/titles/${editingTitle.id}`, payload);
        alert('칭호가 수정되었습니다.');
      } else {
        await api.post('/admin/titles', payload);
        alert('신규 칭호가 등록되었습니다.');
      }
      setActiveTab('titles');
    } catch (error: any) {
      console.error('칭호 등록/수정 실패:', error);
      alert(error.response?.data?.message || '처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('titles')}
          aria-label="칭호 목록으로 돌아가기"
          className="p-2 rounded-xl hover:bg-black/5"
        >
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-2xl font-black text-black">
          {editingTitle ? '칭호 정보 수정' : '신규 칭호 마스터 클래스 등록'}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <GlassCard>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  칭호 명칭 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  required
                  aria-required="true"
                  className={`w-full bg-black/[0.02] border px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40 ${
                    errors.name ? 'border-red-500 ring-red-500/10' : 'border-black/5'
                  }`}
                  placeholder="예: 전설의 쾌변가"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  이모지/아이콘 (imageUrl)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40"
                  placeholder="단일 이모지 입력을 권장합니다 (예: 👑)"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                칭호 설명 *
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.description;
                      return next;
                    });
                  }
                }}
                required
                aria-required="true"
                className={`w-full bg-black/[0.02] border px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none outline-none focus:ring-4 ring-[#1B4332]/10 transition-all text-black placeholder:text-black/40 ${
                  errors.description ? 'border-red-500 ring-red-500/10' : 'border-black/5'
                }`}
                placeholder="획득 시 표시될 설명을 입력하세요..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  업적 평가 기준 *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AchievementType)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold outline-none text-[#1B4332]"
                >
                  {Object.entries(ACHIEVEMENT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block tracking-widest">
                  임계값 (Threshold) *
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold outline-none text-[#1B4332] placeholder:text-black/40"
                  min="0"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 disabled:opacity-50"
              >
                {isSubmitting
                  ? '데이터 처리 엔진 작동 중...'
                  : editingTitle
                  ? '수정 완료'
                  : '시스템 등록'}
              </button>
              <button
                onClick={() => setActiveTab('titles')}
                className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black hover:bg-black/10 transition-colors"
              >
                등록 취소
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export default AddTitleView;
