import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoginForm } from './auth/LoginForm';
import { SignupForm } from './auth/SignupForm';

type AuthMode = 'login' | 'signup';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [modeDir, setModeDir] = useState(1);

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toSignup = useCallback(() => { setModeDir(1); setMode('signup'); }, []);
  const toLogin = useCallback(() => { setModeDir(-1); setMode('login'); }, []);
  const handleSuccess = useCallback(() => { onSuccess?.(); onClose(); }, [onSuccess, onClose]);

  const modeVar = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 30 : -30 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -30 : 30 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(27,67,50,0.45)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[440px] bg-white rounded-[32px] overflow-hidden"
            style={{ 
              boxShadow: '0 20px 60px -10px rgba(27,67,50,0.3), 0 0 0 1px rgba(27,67,50,0.05)',
              padding: '40px'
            }}
          >
            {/* 닫기 버튼 */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-gray-100 active:scale-90"
              style={{ color: 'rgba(26,43,39,0.3)' }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* 브랜드 로고/아이콘 */}
            <div className="flex justify-start mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                style={{ background: '#f8faf9', border: '1.5px solid rgba(26,43,39,0.06)' }}>
                💩
              </div>
            </div>

            {/* 메인 폼 애니메이션 */}
            <AnimatePresence mode="wait" custom={modeDir}>
              <motion.div 
                key={mode} 
                custom={modeDir} 
                variants={modeVar}
                initial="enter" 
                animate="center" 
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {mode === 'login' ? (
                  <LoginForm onSwitch={toSignup} onSuccess={handleSuccess} onClose={onClose} />
                ) : (
                  <SignupForm onSwitch={toLogin} onSuccess={handleSuccess} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
