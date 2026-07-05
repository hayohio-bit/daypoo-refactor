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
  borderRadius = '8px' 
}: SkeletonProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ width, height, borderRadius }}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
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
        {[1, 2, 3, 4].map(i => (
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
