import { motion } from 'framer-motion';
import { Plus, Send } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import { createInquiry } from '../../services/supportService';
import { cardVariants } from './supportAnimations';
import { INQUIRY_CATEGORY_OPTIONS, type InquiryCategory } from './supportTypes';

// ── 1:1 문의 섹션 ───────────────────────────────────────────────────
export function ModernInquiryForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    category: '기타' as InquiryCategory,
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.content.length < 10) return;
    setLoading(true);
    try {
      await createInquiry(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="max-w-2xl mx-auto bg-white rounded-[32px] sm:rounded-[44px] p-6 sm:p-14 border border-black/[0.04] shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-12 text-[#52B788]/5 pointer-events-none">
        <Send size={180} />
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl font-black text-[#1A2B27] mb-8 sm:mb-12 flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 bg-[#1B4332] rounded-[22px] shadow-lg flex items-center justify-center text-white">
            <Plus size={32} />
          </div>
          새로운 문의 남기기
        </h2>

        <form onSubmit={submit} className="space-y-10">
          <div className="space-y-4">
            <label className="text-[12px] font-black text-[#5C6B68]/50 uppercase tracking-[0.2em] ml-2">
              문의 유형
            </label>
            <div className="flex flex-wrap gap-2.5">
              {INQUIRY_CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[13px] sm:text-[14px] font-black transition-all ${formData.category === cat ? 'bg-[#1B4332] text-white shadow-xl scale-105' : 'bg-[#f4f9f6] text-[#5C6B68]/60 hover:bg-[#eaf4ee]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[12px] font-black text-[#5C6B68]/50 uppercase tracking-[0.2em] ml-2">
              문의 제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력해 주세요"
              className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-[20px] sm:rounded-[24px] p-4 sm:p-5.5 text-[15px] sm:text-[17px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[12px] font-black text-[#5C6B68]/50 uppercase tracking-[0.2em] ml-2">
              내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="최소 10자 이상 입력해 주세요"
              rows={8}
              className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 text-[15px] sm:text-[17px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-inner resize-none"
            />
            <div className="flex justify-between items-center px-2 text-[12px] font-bold">
              <span className={formData.content.length < 10 ? 'text-red-400' : 'text-[#52B788]'}>
                {formData.content.length}자
              </span>
              <span className="text-[#5C6B68]/30">평일 기준 24시간 내 순차적 답변</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || !formData.title || formData.content.length < 10}
            className={`w-full py-6 rounded-3xl font-black text-[19px] shadow-2xl flex items-center justify-center gap-4 transition-all ${loading || !formData.title || formData.content.length < 10 ? 'bg-[#f4f9f6] text-[#5C6B68]/30 cursor-not-allowed' : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F] shadow-emerald-900/10'}`}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={24} /> 문의 보내기
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
