import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Hash } from 'lucide-react';
import { listItemVariants } from './supportAnimations';
import type { FaqItem } from './supportTypes';

// ── 3번 효과: Modern Magnetic Glow FAQ Item ────────────────────────────────────
export function TrendyFaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div variants={listItemVariants} className="group relative mb-4">
      {/* Open 상태 글로우 (기존 유지) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute -inset-1 bg-gradient-to-r from-[#52B788]/20 via-[#E8A838]/10 to-[#52B788]/20 blur-xl rounded-[32px] z-0"
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
          />
        )}
      </AnimatePresence>

      <div
        className={`relative z-10 bg-white rounded-[26px] border overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-xl ${
          isOpen
            ? 'border-[#52B788]/40 shadow-[0_10px_40px_rgba(27,67,50,0.1)]'
            : 'border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#52B788]/20'
        }`}
      >
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 sm:py-6 text-left"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#1B4332] text-white' : 'bg-[#f4f9f6] text-[#52B788]'}`}
          >
            <Hash size={14} className={isOpen ? 'opacity-100' : 'opacity-40'} />
          </div>
          <span
            className={`flex-1 text-[14px] sm:text-[16px] font-bold ${isOpen ? 'text-[#1B4332]' : 'text-[#1A2B27]'}`}
          >
            {item.q}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.2 : 1 }}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'text-[#52B788]' : 'text-[#5C6B68]/30'}`}
          >
            <ChevronDown size={22} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 pl-16 sm:pl-24 relative">
                <div className="absolute left-[32px] sm:left-[38px] top-0 bottom-8 w-[2px] bg-gradient-to-b from-[#52B788]/30 to-transparent rounded-full" />
                <p className="text-[15px] leading-relaxed text-[#5C6B68] font-medium whitespace-pre-wrap">
                  {item.a}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
