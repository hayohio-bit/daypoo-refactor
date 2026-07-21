import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import WaveButtonComponent from '../../components/WaveButton';
import { GlassCard } from '../../components/common/GlassCard';
import { api } from '../../services/apiClient';
import type {
  AdminInquiryDetailResponse,
  AdminInquiryListResponse,
  AdminStatsResponse,
  InquiryStatus,
  PageResponse,
} from '../../types/admin';
import { COLORS } from './adminCommons';

export interface CsViewProps {
  stats: AdminStatsResponse | null;
  onStatsRefresh: () => void;
}

export const CsView = ({ stats, onStatsRefresh }: CsViewProps) => {
  const [inquiries, setInquiries] = useState<AdminInquiryListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InquiryStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiryListResponse | null>(null);
  const [inquiryDetail, setInquiryDetail] = useState<AdminInquiryDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [generatingData, setGeneratingData] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (filter !== 'ALL') params.append('status', filter);

      console.log(`[AdminInquiry] Fetching inquiries with params: ${params.toString()}`);
      const response = await api.get<PageResponse<AdminInquiryListResponse>>(
        `/admin/inquiries?${params}`,
      );
      setInquiries(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      console.error('문의 목록 조회 실패:', error);
      setInquiries([]);
      setTotalPages(0);

      if (error.status && error.status >= 500) {
        const errorMessage = error.message || '서버 오류가 발생했습니다.';
        alert(`문의 목록 조회 실패: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTestData = async () => {
    if (generatingData) return;
    setGeneratingData(true);
    try {
      await api.post('/admin/inquiries/generate-test-data');
      alert('30개의 테스트 문의 데이터가 생성되었습니다.');
      fetchInquiries();
      onStatsRefresh();
    } catch (error: any) {
      console.error('테스트 데이터 생성 실패:', error);
      const errorMessage = error.message || '데이터 생성 중 오류가 발생했습니다.';
      alert(`테스트 데이터 생성 실패: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
    } finally {
      setGeneratingData(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, filter]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  const handleOpenInquiryDetail = async (inquiry: AdminInquiryListResponse) => {
    setSelectedInquiry(inquiry);
    setShowInquiryModal(true);
    setLoadingDetail(true);
    setAnswerText('');
    try {
      const detail = await api.get<AdminInquiryDetailResponse>(`/admin/inquiries/${inquiry.id}`);
      setInquiryDetail(detail);
      if (detail.answer) {
        setAnswerText(detail.answer);
      }
    } catch (error) {
      console.error('문의 상세 조회 실패:', error);
      alert('문의 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!inquiryDetail || !answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await api.post(`/admin/inquiries/${inquiryDetail.id}/answer`, { answer: answerText });
      alert('답변이 등록되었습니다.');
      setShowInquiryModal(false);
      fetchInquiries();
      onStatsRefresh();
    } catch (error) {
      console.error('답변 등록 실패:', error);
      alert('답변 등록에 실패했습니다.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h3 className="text-2xl font-black text-black">고객 지원 센터</h3>
            <p className="text-sm text-black/60 font-bold">1:1 문의 관리 및 답변</p>
          </div>
          <WaveButtonComponent
            onClick={handleGenerateTestData}
            disabled={generatingData}
            variant="accent"
            size="sm"
            className="shadow-lg animate-none"
            icon={
              generatingData ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )
            }
          >
            {generatingData ? '데이터 생성 중...' : '테스트 데이터 30개 생성'}
          </WaveButtonComponent>
        </div>
        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === 'ALL'
                ? 'bg-[#1B4332] text-white shadow-lg'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-black/5 hover:border-[#1B4332]/40'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === 'PENDING'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400'
            }`}
          >
            미답변{' '}
            {stats?.pendingInquiries && stats.pendingInquiries > 0
              ? `(${stats.pendingInquiries})`
              : ''}
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === 'COMPLETED'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400'
            }`}
          >
            답변 완료
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : inquiries.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare size={48} className="text-black/20 mb-4" />
            <h4 className="text-lg font-black text-black mb-2">문의 데이터가 없습니다</h4>
            <p className="text-sm text-black/40 mb-6">
              테스트 데이터를 생성하거나 실제 문의가 등록될 때까지 기다려주세요
            </p>
            <button
              onClick={handleGenerateTestData}
              disabled={generatingData}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm shadow-lg transition-all disabled:opacity-50"
            >
              {generatingData ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {generatingData ? '생성 중...' : '테스트 데이터 생성'}
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="p-0 border-none bg-transparent shadow-none">
            <div
              className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl"
              style={{ borderColor: COLORS.border }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      사용자
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      문의 유형
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      제목
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      등록 시간
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">
                      상태
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      className="border-b transition-colors hover:bg-black/[0.01]"
                      style={{ borderColor: COLORS.border }}
                    >
                      <td className="px-8 py-5">
                        <div>
                          <div className="font-black text-sm text-black">{inq.userName}</div>
                          <div className="text-xs text-black/30 font-bold">{inq.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-black/60">{inq.type}</td>
                      <td className="px-8 py-5 font-bold text-black max-w-xs truncate">
                        {inq.title}
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-black/40">
                        {formatTimeAgo(inq.createdAt)}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                            inq.status === 'PENDING'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {inq.status === 'PENDING' ? '미답변' : '완료'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleOpenInquiryDetail(inq)}
                          className="px-3 py-1.5 rounded-xl bg-[#1B4332] text-white text-xs font-black hover:bg-[#2D6A4F] transition-colors"
                        >
                          {inq.status === 'PENDING' ? '답변하기' : '상세보기'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-sm text-black">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showInquiryModal && selectedInquiry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowInquiryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-3xl w-full mx-4 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-[#1B4332]">문의 상세</h3>
                <button
                  onClick={() => setShowInquiryModal(false)}
                  className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
                </div>
              ) : inquiryDetail ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        문의자
                      </p>
                      <p className="text-sm font-bold text-black/80">{inquiryDetail.userName}</p>
                      <p className="text-xs text-black/40 mt-1">{inquiryDetail.userEmail}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        문의 유형
                      </p>
                      <p className="text-sm font-bold text-black/80">{inquiryDetail.type}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        등록일
                      </p>
                      <p className="text-sm font-bold text-black/80">
                        {new Date(inquiryDetail.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">
                        상태
                      </p>
                      <span
                        className={`inline-block text-xs font-black px-3 py-1.5 rounded-lg ${
                          inquiryDetail.status === 'PENDING'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {inquiryDetail.status === 'PENDING' ? '미답변' : '답변 완료'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/[0.02] rounded-2xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">
                      제목
                    </p>
                    <p className="text-base font-bold text-black mb-4">{inquiryDetail.title}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">
                      문의 내용
                    </p>
                    <p className="text-sm text-black/70 whitespace-pre-wrap leading-relaxed">
                      {inquiryDetail.content}
                    </p>
                  </div>

                  <div className="bg-black/[0.02] rounded-2xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">
                      답변
                    </p>
                    {inquiryDetail.status === 'PENDING' ? (
                      <div className="space-y-4">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="답변 내용을 입력하세요..."
                          className="w-full h-40 px-4 py-3 rounded-2xl border bg-white text-sm text-black/80 focus:ring-2 ring-[#1B4332]/20 outline-none resize-none"
                        />
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={submittingAnswer || !answerText.trim()}
                          className="w-full py-3 bg-[#1B4332] text-white rounded-2xl font-black text-sm hover:bg-[#2D6A4F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingAnswer ? '등록 중...' : '답변 등록'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-black/70 whitespace-pre-wrap leading-relaxed bg-white rounded-xl p-4">
                          {inquiryDetail.answer || '답변이 없습니다.'}
                        </p>
                        <p className="text-xs text-black/40">
                          답변일: {new Date(inquiryDetail.updatedAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-black/40 py-10">문의 정보를 불러올 수 없습니다.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default CsView;
