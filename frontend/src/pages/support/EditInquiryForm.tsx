import { useState } from 'react';
import type React from 'react';
import { updateInquiry } from '../../services/supportService';
import { INQUIRY_CATEGORY_OPTIONS, type Inquiry } from './supportTypes';

// ── 문의 수정 폼 ───────────────────────────────────────────────────
export function EditInquiryForm({
  inq,
  onCancel,
  onSuccess,
}: {
  inq: Inquiry;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    category: inq.category,
    title: inq.title,
    content: inq.content,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.content.length < 10) return;
    setLoading(true);
    try {
      await updateInquiry(inq.id, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || '수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="space-y-3">
        <label className="text-[11px] font-black text-[#5C6B68]/40 uppercase tracking-[0.2em] ml-2">
          문의 유형
        </label>
        <div className="flex flex-wrap gap-2">
          {INQUIRY_CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
              className={`px-5 py-3 rounded-2xl text-[13px] font-black transition-all ${formData.category === cat ? 'bg-[#1B4332] text-white shadow-lg' : 'bg-[#f4f9f6] text-[#5C6B68]/60 hover:bg-[#eaf4ee]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[11px] font-black text-[#5C6B68]/40 uppercase tracking-[0.2em] ml-2">
          문의 제목
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-2xl p-5 text-[16px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-inner"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[11px] font-black text-[#5C6B68]/40 uppercase tracking-[0.2em] ml-2">
          내용
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          rows={6}
          className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-[30px] p-6 text-[16px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-inner resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-5 rounded-3xl font-black text-[17px] bg-[#f4f9f6] text-[#5C6B68]/60 hover:bg-[#eaf4ee] transition-all"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title || formData.content.length < 10}
          className={`flex-[2] py-5 rounded-3xl font-black text-[17px] shadow-xl flex items-center justify-center gap-2 transition-all ${loading || !formData.title || formData.content.length < 10 ? 'bg-black/5 text-black/20' : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '수정 완료'
          )}
        </button>
      </div>
    </form>
  );
}
