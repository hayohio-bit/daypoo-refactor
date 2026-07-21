import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function LoadingSkeleton({
  className = '',
  width = '100%',
  height = '14px',
  borderRadius = '8px',
}: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ width, height, borderRadius }}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 1.5,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-lg"
      />
    </div>
  );
}

export function MyPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-32 space-y-12">
      {/* 아바타 히어로 스켈레톤 */}
      <div className="flex items-end gap-6 mb-12">
        <LoadingSkeleton width={92} height={92} borderRadius={32} />
        <div className="flex-1 space-y-3 pb-2">
          <LoadingSkeleton width={80} height={20} borderRadius={10} />
          <LoadingSkeleton width="60%" height={32} borderRadius={12} />
          <LoadingSkeleton width="40%" height={8} borderRadius={4} />
        </div>
        <div className="space-y-4 pb-2 hidden sm:block">
          <LoadingSkeleton width={100} height={12} />
          <LoadingSkeleton width={120} height={12} />
          <LoadingSkeleton width={80} height={12} />
        </div>
      </div>

      {/* 탭 바 스켈레톤 */}
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} className="flex-1" height={44} borderRadius={16} />
        ))}
      </div>

      {/* 메인 뉴스/카드 스켈레톤 */}
      <div className="space-y-6">
        <LoadingSkeleton height={320} borderRadius={32} />
        <LoadingSkeleton height={240} borderRadius={32} />
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 상단 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[24px] p-6 border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <LoadingSkeleton width={44} height={44} borderRadius={16} />
              <LoadingSkeleton width={60} height={20} borderRadius={8} />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton width="40%" height={12} />
              <LoadingSkeleton width="70%" height={32} borderRadius={8} />
            </div>
            <LoadingSkeleton width="100%" height={8} borderRadius={4} />
          </div>
        ))}
      </div>

      {/* 차트 영역 스켈레톤 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-gray-100 space-y-4">
          <div className="flex justify-between">
            <LoadingSkeleton width={150} height={20} />
            <LoadingSkeleton width={100} height={32} borderRadius={8} />
          </div>
          <LoadingSkeleton width="100%" height={300} borderRadius={16} />
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 space-y-4">
          <LoadingSkeleton width={120} height={20} />
          <div className="flex justify-center items-center py-6">
            <LoadingSkeleton width={200} height={200} borderRadius="50%" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RankingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 탭 헤더 스켈레톤 */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} width={120} height={40} borderRadius={12} />
        ))}
      </div>

      {/* 포디움 (상위 3명) 스켈레톤 */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto items-end pt-12 pb-6">
        <div className="flex flex-col items-center gap-3">
          <LoadingSkeleton width={80} height={80} borderRadius="50%" />
          <LoadingSkeleton width={70} height={16} />
          <div className="bg-white w-full h-24 rounded-t-2xl border border-gray-100 flex items-center justify-center">
            <LoadingSkeleton width={30} height={24} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <LoadingSkeleton width={96} height={96} borderRadius="50%" />
          <LoadingSkeleton width={90} height={18} />
          <div className="bg-white w-full h-32 rounded-t-2xl border border-gray-100 flex items-center justify-center">
            <LoadingSkeleton width={30} height={24} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <LoadingSkeleton width={80} height={80} borderRadius="50%" />
          <LoadingSkeleton width={70} height={16} />
          <div className="bg-white w-full h-20 rounded-t-2xl border border-gray-100 flex items-center justify-center">
            <LoadingSkeleton width={30} height={24} />
          </div>
        </div>
      </div>

      {/* 랭킹 리스트 스켈레톤 */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100">
            <LoadingSkeleton width={24} height={20} />
            <LoadingSkeleton width={44} height={44} borderRadius="50%" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton width={120} height={16} />
              <LoadingSkeleton width={80} height={12} />
            </div>
            <LoadingSkeleton width={60} height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}

