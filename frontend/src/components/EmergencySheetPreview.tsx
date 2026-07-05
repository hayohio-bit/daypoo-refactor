import { motion } from 'framer-motion';
import { Navigation, Clock, MapPin, Sparkles, Flame } from 'lucide-react';

interface ToiletItem {
  id: string;
  rank: number;
  name: string;
  distanceStr: string;
  timeStr: string;
  isOpen24h: boolean;
  lat: number;
  lng: number;
}

interface EmergencySheetPreviewProps {
  processedToilets: ToiletItem[];
  openNav: (item: ToiletItem) => void;
}

/**
 * EmergencySheetPreview: 급똥 발생 시 한눈에 볼 수 있는 세로 리스트로
 * 최적의 화장실 경로를 추천합니다. Premium Glass morphism 디자인 적용.
 */
export function EmergencySheetPreview({ processedToilets, openNav }: EmergencySheetPreviewProps) {
  if (!processedToilets || processedToilets.length === 0) {
    return (
      <div className="py-12 text-center text-emerald-100/40">
        <p className="text-sm font-medium">주변 1km 이내에 개방된 화장실이 없습니다.</p>
      </div>
    );
  }

  const RANK_CONFIGS = [
    {
      gradient: 'linear-gradient(135deg, rgba(232,93,93,0.35) 0%, rgba(199,62,62,0.25) 100%)',
      glowColor: 'rgba(232,93,93,0.4)',
      icon: Flame,
      iconColor: '#FFD700',
      accentColor: '#FF6B6B',
    },
    {
      gradient: 'linear-gradient(135deg, rgba(232,168,56,0.3) 0%, rgba(216,148,32,0.2) 100%)',
      glowColor: 'rgba(232,168,56,0.4)',
      icon: Sparkles,
      iconColor: '#FFF8DC',
      accentColor: '#FFC107',
    },
    {
      gradient: 'linear-gradient(135deg, rgba(82,183,136,0.3) 0%, rgba(45,106,79,0.2) 100%)',
      glowColor: 'rgba(82,183,136,0.4)',
      icon: MapPin,
      iconColor: '#90EE90',
      accentColor: '#52B788',
    },
  ];

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
          <h3 className="text-xs font-black text-white tracking-tight">최적 경로 추천</h3>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-300/60 text-[9px] font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>실시간</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {processedToilets.slice(0, 3).map((item, i) => {
          const config = RANK_CONFIGS[i] || RANK_CONFIGS[2];
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-2xl overflow-hidden backdrop-blur-2xl"
              style={{
                background: config.gradient,
                boxShadow: `0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1), 0 0 20px ${config.glowColor}`,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {/* Glass shine effect - 상단 하이라이트 */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                }}
              />

              {/* Glass reflection gradient */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 40%, transparent 100%)',
                }}
              />

              <div className="relative p-3">
                <div className="flex items-start gap-3">
                  {/* 순위 아이콘 배지 - Premium Glass */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="flex-shrink-0 w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center backdrop-blur-xl relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      boxShadow: `0 8px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 20px ${config.glowColor}`,
                    }}
                  >
                    {/* Inner glow */}
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${config.glowColor} 0%, transparent 70%)`,
                      }}
                    />
                    <Icon size={18} style={{
                      color: config.iconColor,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                      position: 'relative',
                      zIndex: 1,
                    }} />
                  </motion.div>

                  {/* 정보 영역 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-black text-white leading-tight truncate" style={{
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}>
                        {item.name}
                      </h4>
                      {item.isOpen24h && (
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="flex-shrink-0 px-2 py-0.5 rounded-lg text-[8px] font-black backdrop-blur-xl relative overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, rgba(250,204,21,0.4) 0%, rgba(234,179,8,0.3) 100%)',
                            border: '1px solid rgba(250,204,21,0.6)',
                            color: '#FFF',
                            boxShadow: '0 4px 12px rgba(250,204,21,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}
                        >
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                          24H
                        </motion.span>
                      )}
                    </div>

                    {/* 거리 & 시간 */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-white/70" />
                        <span className="text-white text-[11px] font-semibold">
                          {item.distanceStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-white/70" />
                        <span className="text-white text-[11px] font-semibold">
                          {item.timeStr}
                        </span>
                      </div>
                    </div>

                    {/* 길안내 버튼 */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openNav(item)}
                      className="w-full rounded-lg py-2 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        color: '#FFF',
                      }}
                    >
                      <Navigation size={13} />
                      <span>길안내 시작</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
