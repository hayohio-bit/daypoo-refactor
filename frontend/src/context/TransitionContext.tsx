import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaintCurtain } from '../components/PaintCurtain';

type Phase = 'down' | 'up' | 'idle';

interface TransitionContextType {
  transitionTo: (path: string) => void;
  phase: Phase;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase]     = useState<Phase>('idle');
  const [targetPath, setTargetPath] = useState('');

  const transitionTo = useCallback((path: string) => {
    // 1. Only '/ranking' uses the special curtain, and ONLY ONCE per session.
    if (path === '/ranking') {
      const hasPlayedRanking = sessionStorage.getItem('has_played_ranking');
      if (hasPlayedRanking) {
        navigate(path);
        return;
      }
      sessionStorage.setItem('has_played_ranking', 'true');
    } 
    // 2. Only Splash ('/') to Main ('/main') uses the curtain.
    else if (path === '/main') {
      if (window.location.pathname !== '/') {
        navigate(path);
        return;
      }
    }
    // 3. For all other paths (Map, Support, MyPage, etc.), it's immediate.
    else {
      navigate(path);
      return;
    }

    setTargetPath(path);
    setVisible(true);
    setPhase('down'); // 커튼 내려오기 시작
  }, [navigate]);

  const handleDownComplete = useCallback(() => {
    navigate(targetPath);         // 페이지 이동
    setPhase('up');               // 커튼 걷히기 시작
  }, [navigate, targetPath]);

  const handleUpComplete = useCallback(() => {
    setPhase('idle');
    setVisible(false);
  }, []);

  return (
    <TransitionContext.Provider value={{ transitionTo, phase }}>
      <PaintCurtain
        isVisible={visible}
        phase={phase}
        onComplete={phase === 'down' ? handleDownComplete : handleUpComplete}
      />
      {children}
    </TransitionContext.Provider>
  );
}

export const useTransitionContext = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransitionContext must be used within a TransitionProvider');
  }
  return context;
};
