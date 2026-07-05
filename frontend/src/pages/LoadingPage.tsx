import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function LoadingPage() {
  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-[#f8faf9] overflow-hidden font-sans z-[9999]" style={{ transform: 'translateZ(0)' }}>
      <style>{`
        @keyframes morph {
          0% { border-radius: 24%; background-color: #1B4332; transform: rotate(0deg) scale(1); }
          25% { border-radius: 24%; background-color: #2d6a4f; transform: rotate(45deg) scale(1.1); }
          50% { border-radius: 50%; background-color: #E8A838; transform: rotate(180deg) scale(1.1); }
          75% { border-radius: 50%; background-color: #2d6a4f; transform: rotate(225deg) scale(1.05); }
          100% { border-radius: 24%; background-color: #1B4332; transform: rotate(360deg) scale(1); }
        }
        @keyframes sparkle-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.2; scale: 1; }
          50% { opacity: 0.4; scale: 1.1; }
        }
        @keyframes dot-bounce {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .morph-container {
          animation: morph 6s ease-in-out infinite;
          will-change: transform, border-radius, background-color;
        }
        .glow-overlay {
          animation: pulse-soft 3s ease-in-out infinite;
        }
        .sparkle-container {
          animation: sparkle-rotate 10s linear infinite;
        }
        .dot-ani {
          animation: dot-bounce 1s ease-in-out infinite;
        }
        .fade-in-ani {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      {/* 배경 장식 (Simplified) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1B4332]/10 blur-[40px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E8A838]/10 blur-[40px]" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Morphing Loader Area */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer Glow Overlay */}
          <div className="absolute inset-0 rounded-full bg-[#1B4332]/5 blur-xl glow-overlay" />

          {/* Real Morphing Object */}
          <div className="w-16 h-16 morph-container shadow-[0_10px_40px_rgba(27,67,50,0.1)]" />

          {/* Floating Sparkles container */}
          <div className="absolute inset-0 sparkle-container">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-amber-500 opacity-60">
              <Sparkles size={16} />
            </div>
          </div>
        </div>

        {/* Text Loading */}
        <div className="mt-12 text-center fade-in-ani">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-['SchoolSafetyNotification'] text-2xl font-bold text-[#1A2B27]">
              Day<span className="text-[#E8A838]">.</span>Poo
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-[#7a9e8a] tracking-[0.2em]">
              로딩 중!
            </p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#1B4332] dot-ani"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tip */}
      <div className="absolute bottom-12 text-center px-6 opacity-40">
        <p className="text-[11px] text-[#7a9e8a] font-medium tracking-tight">
          "오늘의 건강은 어제의 기록으로부터 시작됩니다."
        </p>
      </div>
    </div>
  );
}
