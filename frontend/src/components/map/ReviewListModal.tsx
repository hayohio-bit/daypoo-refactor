import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ToiletData, EMOJI_TAG_MAP } from '../../types/toilet';
import { getReviews, getReviewSummary, ToiletReviewPageResponse, ToiletReviewSummaryResponse } from '../../services/reviewService';

interface ReviewListModalProps {
  toilet: ToiletData;
  onClose: () => void;
}

export function ReviewListModal({ toilet, onClose }: ReviewListModalProps) {
  const [reviewData, setReviewData] = useState<ToiletReviewPageResponse | null>(null);
  const [summaryData, setSummaryData] = useState<ToiletReviewSummaryResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchReviews = async (page: number) => {
    try {
      setLoading(true);
      const [reviews, summary] = await Promise.all([
        getReviews(Number(toilet.id), page, pageSize, 'latest'),
        currentPage === 0 ? getReviewSummary(Number(toilet.id)) : Promise.resolve(summaryData)
      ]);
      setReviewData(reviews);
      if (currentPage === 0 && summary) {
        setSummaryData(summary);
      }
    } catch (error) {
      console.error('리뷰 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage, toilet.id]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (reviewData && currentPage < reviewData.totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-[560px] bg-white rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef5f0]">
          <div>
            <p className="text-[10px] font-bold text-[#7a9e8a] uppercase tracking-wider">REVIEWS</p>
            <h2 className="font-black text-xl text-[#1a2b22]">전체 후기</h2>
            <p className="text-xs text-[#7a9e8a] mt-0.5">{toilet.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#f4faf6] text-[#7a9e8a] flex items-center justify-center hover:bg-[#e8f3ec] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin" size={32} style={{ color: '#7a9e8a' }} />
            </div>
          ) : (
            <>
              {/* AI 요약 (첫 페이지만) */}
              {currentPage === 0 && summaryData?.aiSummary && (
                <div className="mb-6 p-4 rounded-2xl" style={{ background: '#f4faf6' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">✨</span>
                    <span className="text-sm font-bold" style={{ color: '#2D6A4F' }}>AI 요약</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#5a7a6a' }}>
                    {summaryData.aiSummary}
                  </p>
                </div>
              )}

              {/* 통계 정보 (첫 페이지만) */}
              {currentPage === 0 && summaryData && (
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={18}
                        fill={i <= Math.round(summaryData?.avgRating ?? 0) ? '#E8A838' : 'none'}
                        stroke={i <= Math.round(summaryData?.avgRating ?? 0) ? '#E8A838' : '#d4e8db'}
                      />
                    ))}
                    <span className="ml-1.5 text-base font-bold" style={{ color: '#1B4332' }}>
                      {(summaryData?.avgRating ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: '#7a9e8a' }}>
                    총 {summaryData.reviewCount}개의 후기
                  </span>
                </div>
              )}

              {/* 리뷰 목록 */}
              {reviewData && reviewData.contents && reviewData.contents.length > 0 ? (
                <div className="space-y-4">
                  {reviewData.contents.map((review) => (
                    <div
                      key={review.id}
                      className="pb-4 border-b last:border-0"
                      style={{ borderColor: '#eef5f0' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: '#1a2b22' }}>
                            {review.userName}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i <= review.rating ? '#E8A838' : 'none'}
                                stroke={i <= review.rating ? '#E8A838' : '#d4e8db'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: '#95a99e' }}>
                          {formatTimeAgo(review.createdAt)}
                        </span>
                      </div>

                      {review.emojiTags && review.emojiTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {review.emojiTags.map((tag) => {
                            const emojiData = EMOJI_TAG_MAP[tag as keyof typeof EMOJI_TAG_MAP];
                            return emojiData ? (
                              <span
                                key={tag}
                                className="text-xs px-2.5 py-1 rounded-full"
                                style={{ background: '#f4faf6', color: '#5a7a6a' }}
                              >
                                {emojiData.emoji} {emojiData.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      <p className="text-sm leading-relaxed" style={{ color: '#5a7a6a' }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: '#7a9e8a' }}>
                    아직 후기가 없어요
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 페이지네이션 */}
        {reviewData && typeof reviewData.totalPages === 'number' && reviewData.totalPages > 1 && (
          <div className="px-6 py-4 bg-[#fcfdfc] border-t border-[#eef5f0] flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: currentPage === 0 ? '#f4faf6' : '#e8f3ec',
                color: currentPage === 0 ? '#95a99e' : '#2D6A4F'
              }}
            >
              <ChevronLeft size={16} />
              이전
            </button>

            <span className="text-sm font-bold" style={{ color: '#1a2b22' }}>
              {currentPage + 1} / {reviewData.totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= reviewData.totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: currentPage >= reviewData.totalPages - 1 ? '#f4faf6' : '#e8f3ec',
                color: currentPage >= reviewData.totalPages - 1 ? '#95a99e' : '#2D6A4F'
              }}
            >
              다음
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
