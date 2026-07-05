import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  rightEl?: React.ReactNode;
  maxLength?: number;
}

export function InputField({
  label, type = 'text', value, onChange, placeholder,
  error, hint, autoComplete, rightEl, maxLength,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-xs font-bold"
        style={{ color: 'rgba(26,43,39,0.5)', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div className="relative flex items-center rounded-xl transition-all duration-200"
        style={{
          background: focused ? '#fff' : '#f8faf9',
          border: error
            ? '1.5px solid rgba(232,93,93,0.55)'
            : focused
            ? '1.5px solid rgba(232,168,56,0.6)'
            : '1.5px solid rgba(26,43,39,0.08)',
          boxShadow: focused ? '0 0 0 4px rgba(232,168,56,0.08)' : 'none',
        }}>
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className="w-full bg-transparent outline-none text-sm font-medium px-4 py-3 placeholder:text-[#5C6B68]/40"
          style={{ color: '#1A2B27', caretColor: '#E8A838' }}
        />
        {rightEl && <div className="pr-3.5 flex-shrink-0">{rightEl}</div>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#E85D5D' }}>
            <AlertCircle size={11} />{error}
          </motion.p>
        )}
        {!error && hint && (
          <p className="text-xs" style={{ color: 'rgba(26,43,39,0.35)' }}>{hint}</p>
        )}
      </AnimatePresence>
    </div>
  );
}
