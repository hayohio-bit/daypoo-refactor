import React from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, MessageSquare, Info, Star } from 'lucide-react';

export type ToastType = 'info' | 'achievement' | 'message' | 'star' | 'error';

interface NotificationToastProps {
  type: ToastType;
  title: string;
  message: string;
  icon?: string;
  onClose: () => void;
}

export function NotificationToast({ type, title, message, icon, onClose }: NotificationToastProps) {
  const getIcon = () => {
    if (icon) return <span className="text-xl">{icon}</span>;
    switch (type) {
      case 'achievement': return <Trophy className="text-yellow-500" size={18} />;
      case 'message': return <MessageSquare className="text-blue-500" size={18} />;
      case 'star': return <Star className="text-purple-500 fill-purple-500" size={18} />;
      case 'error': return <X className="text-red-500" size={18} />;
      default: return <Info className="text-emerald-500" size={18} />;
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'achievement': return '#E8A838';
      case 'message': return '#3B82F6';
      case 'star': return '#A855F7';
      case 'error': return '#EF4444';
      default: return '#1B4332';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        mass: 1 
      }}
      className="pointer-events-auto group relative flex items-center gap-4 bg-white/95 backdrop-blur-md p-4 pr-10 rounded-[24px] shadow-[0_15px_45px_-10px_rgba(0,0,0,0.15)] border border-white min-w-[280px] max-w-[360px] overflow-hidden"
    >
      {/* 액센트 바 */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: getAccentColor() }}
      />

      {/* 아이콘 컨테이너 */}
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${getAccentColor()}15` }} // 15% opacity
      >
        {getIcon()}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-black text-[#1A2B27] leading-tight mb-1">
          {title}
        </h3>
        <p className="text-xs text-gray-500 leading-normal line-clamp-2">
          {message}
        </p>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 bg-gray-50 text-gray-400 hover:text-gray-600 transition-all"
      >
        <X size={14} />
      </button>

      {/* 프로그래스 바 (자동 사라짐 시간 시각화) */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-0.5 bg-gray-100 group-hover:bg-emerald-500/20"
      />
    </motion.div>
  );
}
