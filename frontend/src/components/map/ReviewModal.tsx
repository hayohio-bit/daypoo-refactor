import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, Loader2 } from 'lucide-react';
import WaveButtonComponent from '../WaveButton';
import { ToiletData, EMOJI_TAG_MAP } from '../../types/toilet';
import { createReview, ToiletReviewCreateRequest } from '../../services/reviewService';

interface ReviewModalProps {
  toilet: ToiletData;
  onClose: () => void;
  onSuccess: () => void; // 리뷰 작성 성공 시 호출
}

export function ReviewModal({ toilet, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    if (!comment.trim()) {
      alert('후기 내용을 입력해주세요!');
      return;
    }

    setIsSubmitting(true);
    try {
      const request: ToiletReviewCreateRequest = {
        rating,
        emojiTags: selectedTags,
        comment: comment.trim(),
      };
      await createReview(Number(toilet.id), request);
      alert('후기가 등록되었습니다! 감사합니다 💚');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('리뷰 작성 실패:', error);
      alert(error.message || '후기 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
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
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef5f0]">
          <div>
            <p className="text-[10px] font-bold text-[#7a9e8a] uppercase tracking-wider">REVIEW</p>
            <h2 className="font-black text-xl text-[#1a2b22]">후기 남기기</h2>
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
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* 별점 선택 */}
          <div>
            <p className="font-black text-lg text-[#1a2b22] mb-3">별점을 남겨주세요</p>
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={40}
                    fill={star <= (hoverRating || rating) ? '#E8A838' : 'none'}
                    stroke={star <= (hoverRating || rating) ? '#E8A838' : '#d4e8db'}
                    className="transition-colors"
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-bold" style={{ color: '#E8A838' }}>
                {rating === 5 ? '최고예요! ⭐' :
                 rating === 4 ? '좋아요! 😊' :
                 rating === 3 ? '괜찮아요 👍' :
                 rating === 2 ? '별로예요 😐' :
                 '아쉬워요 😢'}
              </p>
            )}
          </div>

          {/* 이모지 태그 */}
          <div>
            <p className="font-black text-lg text-[#1a2b22] mb-3">어떤 점이 좋았나요?</p>
            <p className="text-xs text-[#7a9e8a] mb-3">중복 선택 가능해요</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EMOJI_TAG_MAP).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleTagToggle(key)}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                    selectedTags.includes(key)
                      ? 'bg-[#1B4332] border-[#1B4332] text-white'
                      : 'bg-white border-[#eef5f0] text-[#1B4332]'
                  }`}
                >
                  {value.emoji} {value.label}
                </button>
              ))}
            </div>
          </div>

          {/* 코멘트 입력 */}
          <div>
            <p className="font-black text-lg text-[#1a2b22] mb-3">후기를 남겨주세요</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="다른 분들에게 도움이 되는 솔직한 후기를 남겨주세요 😊"
              maxLength={500}
              className="w-full h-32 px-4 py-3 rounded-2xl border-2 border-[#eef5f0] resize-none focus:outline-none focus:border-[#1B4332] transition-colors text-sm placeholder:text-[#7a9e8a]"
              style={{ color: '#1a2b22' }}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs" style={{ color: '#7a9e8a' }}>
                {comment.length}/500
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 bg-[#fcfdfc] border-t border-[#eef5f0]">
          <WaveButtonComponent
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            variant="primary"
            size="lg"
            className="w-full shadow-lg"
            icon={isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          >
            {isSubmitting ? '등록 중...' : '후기 등록하기'}
          </WaveButtonComponent>
        </div>
      </motion.div>
    </div>
  );
}
