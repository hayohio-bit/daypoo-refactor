import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Edit3, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BaseModal } from '../../components/common/BaseModal';
import { useFeedback } from '../../hooks/useFeedback';
import { deleteInquiry, getMyInquiries } from '../../services/supportService';
import { EditInquiryForm } from './EditInquiryForm';
import { containerVariants, listItemVariants } from './supportAnimations';
import type { Inquiry } from './supportTypes';

// ── 날짜 포맷터 ──────────────────────────────────────────────────────
const formatInquiryDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateStr;
  }
};

// ── 내 문의 내역 섹션 ─────────────────────────────────────────────────
export function ModernHistory() {
  const { notifyError } = useFeedback();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);

  const fetchInquiries = useCallback(async () => {
    try {
      const data = await getMyInquiries();
      if (Array.isArray(data)) setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 문의를 삭제(취소)하시겠습니까?')) return;
    try {
      await deleteInquiry(id);
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    } catch (err) {
      notifyError(err, '문의 삭제 실패');
    }
  };

  const handleEditSuccess = () => {
    setEditingInquiry(null);
    fetchInquiries();
  };

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#52B788]/20 border-t-[#52B788] rounded-full animate-spin" />
        <p className="text-sm font-black text-[#5C6B68]/30 tracking-widest uppercase">
          Fetching Data...
        </p>
      </div>
    );

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid gap-6 max-w-3xl mx-auto"
      >
        {inquiries.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[44px] border border-black/[0.02] shadow-sm">
            <div className="w-24 h-24 bg-[#f4f9f6] rounded-[36px] mx-auto mb-8 flex items-center justify-center text-5xl">
              📫
            </div>
            <p className="text-[#5C6B68]/40 text-lg font-black">아직 등록된 문의 내역이 없어요</p>
          </div>
        ) : (
          inquiries.map((inq, idx) => (
            <motion.div
              key={inq.id}
              variants={listItemVariants}
              className="bg-white border border-black/[0.04] rounded-[24px] sm:rounded-[36px] p-6 sm:p-10 hover:shadow-2xl hover:border-emerald-500/10 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider ${inq.status === '답변 완료' ? 'bg-[#52B788]/10 text-[#2D6A4F]' : 'bg-[#E8A838]/10 text-[#B5810F]'}`}
                  >
                    {inq.status}
                  </span>
                  <span className="text-[13px] font-bold text-[#5C6B68]/30">
                    {formatInquiryDate(inq.createdAt)}
                  </span>
                </div>

                {inq.status === '답변 대기' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingInquiry(inq)}
                      className="p-2 text-[#5C6B68]/30 hover:text-[#52B788] hover:bg-[#52B788]/5 rounded-lg transition-all"
                      title="수정"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(inq.id)}
                      className="p-2 text-[#5C6B68]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-[18px] sm:text-[22px] font-black text-[#1A2B27] mb-4 group-hover:text-[#52B788] transition-colors">
                {inq.title}
              </h3>
              <p className="text-[16px] text-[#5C6B68]/70 line-clamp-2 leading-relaxed font-medium whitespace-pre-wrap">
                {inq.content}
              </p>

              {inq.answer && (
                <div className="mt-10 pt-8 border-t border-black/[0.03] flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white shrink-0 shadow-lg">
                    <Sparkles size={22} />
                  </div>
                  <div className="flex-1 bg-[#f4f9f6] p-7 rounded-[32px]">
                    <p className="text-[16px] font-bold text-[#1B4332] leading-relaxed">
                      " {inq.answer} "
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingInquiry && (
          <BaseModal onClose={() => setEditingInquiry(null)} zIndex={100}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[44px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-12">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-[26px] font-black text-[#1A2B27]">문의 내용 수정</h3>
                  <button
                    onClick={() => setEditingInquiry(null)}
                    className="w-10 h-10 flex items-center justify-center bg-black/5 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <ChevronDown size={24} className="rotate-180" />
                  </button>
                </div>

                <EditInquiryForm
                  inq={editingInquiry}
                  onCancel={() => setEditingInquiry(null)}
                  onSuccess={handleEditSuccess}
                />
              </div>
            </motion.div>
          </BaseModal>
        )}
      </AnimatePresence>
    </>
  );
}
