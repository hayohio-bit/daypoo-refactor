import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GridFlipRevealProps {
  children: React.ReactNode;
  rows?: number;
  cols?: number;
}

export const GridFlipReveal: React.FC<GridFlipRevealProps> = ({ 
  children, 
  rows = 8, 
  cols = 10 
}) => {
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    // 세션당 한 번만 애니메이션 보여주기
    const hasSeenReveal = sessionStorage.getItem('daypoo_grid_reveal_seen');
    
    if (hasSeenReveal) {
      setIsStarted(true);
      setIsFinished(true);
      setShowReveal(false);
    } else {
      setShowReveal(true);
      const startTimer = setTimeout(() => setIsStarted(true), 150);
      const finishTimer = setTimeout(() => {
        setIsFinished(true);
        sessionStorage.setItem('daypoo_grid_reveal_seen', 'true');
      }, 1300); // 1.4s -> 1.3s로 가속 (타일 전파 즉시 페이지 노출)

      return () => {
        clearTimeout(startTimer);
        clearTimeout(finishTimer);
      };
    }
  }, []);

  // 그리드 인덱스 생성
  const tiles = useMemo(() => {
    const t = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        t.push({ r, c, id: `${r}-${c}` });
      }
    }
    return t;
  }, [rows, cols]);

  if (!showReveal && isFinished) {
    return <div className="relative w-full min-h-screen bg-[#F8FAF9]">{children}</div>;
  }

  return (
    <div className="relative w-full min-h-screen bg-[#F8FAF9]">
      {/* 실제 콘텐츠 레이어 - 타일 연출 완료 전까지 겹침 방지를 위해 숨김 */}
      <div className={`relative z-0 ${!isFinished ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>

      {/* 애니메이션 오버레이 레이어 */}
      {!isFinished && (
        <div className="fixed inset-0 z-[999] pointer-events-none grid"
             style={{ 
               gridTemplateRows: `repeat(${rows}, 1fr)`,
               gridTemplateColumns: `repeat(${cols}, 1fr)`,
               perspective: '1500px'
             }}>
          {tiles.map((tile) => (
            <div key={tile.id} className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
              <motion.div
                initial={{ rotateY: 0 }}
                animate={isStarted ? { rotateY: 180, opacity: 0 } : { rotateY: 0, opacity: 1 }}
                transition={{
                  duration: 0.7, // 회전 가속
                  ease: [0.33, 1, 0.68, 1],
                  delay: tile.r * 0.08 // 수직(Top to Bottom) 물결
                }}
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 앞면: 부드러운 하프톤 그린 */}
                <div 
                  className="absolute inset-0 w-full h-full bg-[#2D6A4F]/85 border-[0.2px] border-white/5 shadow-inner"
                  style={{ backfaceVisibility: 'hidden' }}
                />

                {/* 뒷면: 뒤집히면서 사라짐 */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    backfaceVisibility: 'hidden', 
                    transform: 'rotateY(180deg)',
                    background: 'transparent'
                  }}
                />
              </motion.div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
};
