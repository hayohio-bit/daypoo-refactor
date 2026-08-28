import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState } from 'react';

// ── 1번 효과: Magnetic Search Bar ────────────────────────────────────
export function ModernSearch({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-4 sm:mb-8">
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused ? '0 15px 45px rgba(27,67,50,0.15)' : '0 4px 25px rgba(0,0,0,0.06)',
        }}
        className="relative flex items-center bg-white border border-black/[0.05] rounded-[24px] sm:rounded-[28px] p-1.5 sm:p-2 pr-4 sm:pr-6 overflow-hidden transition-shadow mx-4 sm:mx-0"
      >
        <div className="flex items-center justify-center w-12 h-12 text-[#2D6A4F]/40">
          <Search size={20} className={isFocused ? 'text-[#52B788]' : ''} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="도움이 필요하신 내용을 검색해보세요"
          className="flex-1 bg-transparent border-none outline-none py-3 text-[16px] font-bold text-[#1A2B27] placeholder:text-[#5C6B68]/30 placeholder:font-medium"
        />
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAF9] border border-black/[0.03] rounded-xl">
          <span className="text-[10px] font-black text-[#5C6B68]/40">ENTER</span>
        </div>
      </motion.div>
    </div>
  );
}
