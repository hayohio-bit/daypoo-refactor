import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { X, Navigation, Star, Clock, Users, MessageCircle, Loader2, MapPin, Target, Sparkles, CheckCircle2, Smile, Wind, ScrollText, VolumeX } from 'lucide-react';
import WaveButtonComponent from '../WaveButton';
import { ToiletData, EMOJI_TAG_MAP } from '../../types/toilet';
import { getReviewSummary, ToiletReviewSummaryResponse } from '../../services/reviewService';
import { ReviewModal } from './ReviewModal';
import { ReviewListModal } from './ReviewListModal';

interface GeoPosition {
  lat: number;
  lng: number;
}

interface ToiletPopupProps {
  toilet: ToiletData;
  onClose: () => void;
  onFavoriteToggle: (id: string) => void;
  onVisitRequest: () => void;
  userPosition: GeoPosition;
  distanceInMeters: number;
  openAuth: (mode: 'login' | 'signup') => void;
  onReviewUpdate: () => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={16} fill={i <= Math.round(rating) ? '#E8A838' : 'none'} stroke={i <= Math.round(rating) ? '#E8A838' : '#d4e8db'} />
      ))}
      <span className="ml-1.5 text-sm font-bold" style={{ color: '#1B4332' }}>{rating.toFixed(1)}</span>
    </div>
  );
}

const TAG_ICON_MAP: Record<string, React.ReactNode> = {
  clean: <Smile size={12} />,
  smell: <Wind size={12} />,
  tissue: <ScrollText size={12} />,
  crowded: <Users size={12} />,
  quiet: <VolumeX size={12} />,
};

export function ToiletPopup({ 
  toilet, onClose, onFavoriteToggle, onVisitRequest, distanceInMeters, openAuth, onReviewUpdate 
}: ToiletPopupProps) {
  const [reviewSummary, setReviewSummary] = useState<ToiletReviewSummaryResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewListModal, setShowReviewListModal] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; rotate: number; scale: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const summary = await getReviewSummary(Number(toilet.id));
        setReviewSummary(summary);
      } catch (error) {
        console.error('리뷰 요약 조회 실패:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [toilet.id]);

  const handleReviewSuccess = () => {
    getReviewSummary(Number(toilet.id)).then(setReviewSummary);
    onReviewUpdate();
  };

  const triggerBurst = () => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({ // 개수 증가 (8 -> 12)
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 180, // 확산 범위 확대
      y: (Math.random() - 1.2) * 160,  // 높이 가변성 확대
      rotate: (Math.random() - 0.5) * 720, // 더 역동적인 회전
      scale: Math.random() * 0.4 + 0.9,
      duration: 0.8 + Math.random() * 0.7, // 제각각 다른 속도
      delay: i * 0.02 // 미세한 순차 지연
    }));
    setParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1500); // 제거 시간 연장
  };

  const handleFavoriteClick = () => {
    onFavoriteToggle(toilet.id);
    if (!toilet.isFavorite) triggerBurst();
  };

  const isWithinRange = distanceInMeters <= 150;
  const distanceText = distanceInMeters < 1000 ? `${Math.round(distanceInMeters)}m` : `${(distanceInMeters / 1000).toFixed(1)}km`;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <AnimatePresence>
        <m.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-50 w-[calc(100vw-32px)] max-w-96 bg-white rounded-[20px] shadow-2xl border border-[#d4e8db] flex flex-col"
          style={{ maxHeight: '85vh' }}
        >
          <div className="flex items-start justify-between p-5 border-b border-[#eef5f0]">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2 mb-2">
                {toilet.isVisited ? <CheckCircle2 size={18} style={{ color: '#2D6A4F' }} /> : <CheckCircle2 size={18} className="opacity-30" style={{ color: '#7a9e8a' }} />}
                {toilet.isOpen24h && <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#e8f3ec] text-[#2D6A4F]">24H</span>}
              </div>
              <h3 className="font-black text-lg leading-tight text-[#1a2b22]">{toilet.name}</h3>
              <p className="text-sm mt-1 text-[#7a9e8a] leading-relaxed">{toilet.roadAddress}</p>
              {toilet.rating && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={toilet.rating} />
                  <span className="text-sm text-[#7a9e8a]">({toilet.reviewCount}개)</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  {particles.map(p => (
                    <m.div 
                      key={p.id} 
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }} 
                      animate={{ 
                        x: [0, p.x * 0.8, p.x], // 약간 꺾이는 궤적
                        y: [0, p.y, p.y + 20],   // 솟구쳤다가 살짝 떨어짐 (중력)
                        opacity: [0, 1, 1, 0],   // 생성-유지-소멸
                        scale: [0, p.scale, p.scale * 0.7, 0], 
                        rotate: p.rotate 
                      }} 
                      transition={{ 
                        duration: p.duration, 
                        delay: p.delay,
                        times: [0, 0.4, 0.8, 1],
                        ease: [0.23, 1, 0.32, 1] // 부드러운 가속도 곡선
                      }} 
                      className="absolute z-[100] pointer-events-none text-2xl" 
                      style={{ left: '50%', top: '50%', marginLeft: '-12px', marginTop: '-12px' }}
                    >
                      ⭐
                    </m.div>
                  ))}
                </AnimatePresence>
                <m.button
                  onClick={handleFavoriteClick}
                  whileHover={{ scale: 1.15, rotate: toilet.isFavorite ? -5 : 5, boxShadow: '0 4px 12px rgba(232, 168, 56, 0.25)' }}
                  whileTap={{ scale: 0.85 }}
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${toilet.isFavorite ? 'bg-[#fdf3de] border-[#E8A838] text-[#E8A838]' : 'bg-[#f4faf6] border-[#d4e8db] text-[#95a99e]'}`}
                >
                  <Star size={22} fill={toilet.isFavorite ? '#E8A838' : 'none'} stroke={toilet.isFavorite ? '#E8A838' : 'currentColor'} />
                </m.button>
              </div>
              <m.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="w-11 h-11 rounded-full flex items-center justify-center bg-[#f4faf6] text-[#7a9e8a] border border-[#d4e8db]"><X size={20} /></m.button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar rounded-b-[20px]">
            <div className="px-5 py-4 flex flex-col gap-3 border-b border-[#eef5f0]">
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: isWithinRange ? '#2D6A4F' : '#E85D5D' }}>
              {isWithinRange ? <MapPin size={16} /> : <Target size={16} />}
              <span>현위치에서 {distanceText} {isWithinRange ? '✓' : '(인증 범위: 150m 이내)'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#5a7a6a]">
              <Users size={16} style={{ color: '#2D6A4F' }} />
              <span>{toilet.isMixedGender ? '남녀공용' : '남녀 구분'}</span>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-[#eef5f0]">
            <div className="flex items-center justify-between mb-3"><p className="text-sm font-bold text-[#1a2b22]">최근 후기</p></div>
            {loadingReviews ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#7a9e8a]" size={20} /></div> : reviewSummary && reviewSummary.reviewCount > 0 ? (
              <div className="space-y-3">
                {reviewSummary.recentReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="pb-3 border-b last:border-0 border-[#eef5f0]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1a2b22]">{review.userName}</span>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= review.rating ? '#E8A838' : 'none'} stroke={i <= review.rating ? '#E8A838' : '#d4e8db'} />)}</div>
                      </div>
                      <span className="text-xs text-[#95a99e]">{formatTimeAgo(review.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#5a7a6a] leading-relaxed">{review.comment}</p>
                  </div>
                ))}
                <WaveButtonComponent onClick={() => setShowReviewListModal(true)} variant="ghost" size="sm" className="w-full mt-3">전체 {reviewSummary.reviewCount}개 후기 보기</WaveButtonComponent>
              </div>
            ) : <p className="py-6 text-center text-sm text-[#7a9e8a]">아직 후기가 없어요</p>}
          </div>

          <div className="p-5">
            <WaveButtonComponent onClick={onVisitRequest} disabled={!isWithinRange} variant="primary" size="lg" className="w-full shadow-lg" icon={<CheckCircle2 size={18} />}>방문 인증하기</WaveButtonComponent>
            </div>
          </div>
        </m.div>
      </AnimatePresence>

      {showReviewModal && createPortal(<ReviewModal toilet={toilet} onClose={() => setShowReviewModal(false)} onSuccess={handleReviewSuccess} />, document.body)}
      {showReviewListModal && createPortal(<ReviewListModal toilet={toilet} onClose={() => setShowReviewListModal(false)} />, document.body)}
    </>
  );
}
