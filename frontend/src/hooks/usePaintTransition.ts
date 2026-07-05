import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type Phase = 'down' | 'up' | 'idle';

export function usePaintTransition() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase]     = useState<Phase>('idle');
  const [targetPath, setTargetPath] = useState('');

  const transitionTo = useCallback((path: string) => {
    setTargetPath(path);
    setVisible(true);
    setPhase('down'); // 커튼 내려오기 시작
  }, []);

  // 커튼 다 내려오면 호출
  const handleDownComplete = useCallback(() => {
    navigate(targetPath);         // 페이지 이동
    setPhase('up');               // 커튼 걷히기 시작
  }, [navigate, targetPath]);

  // 커튼 다 걷히면 호출
  const handleUpComplete = useCallback(() => {
    setPhase('idle');
    setVisible(false);
  }, []);

  return {
    visible,
    phase,
    transitionTo,
    handleDownComplete,
    handleUpComplete,
  };
}