import { useEffect, useState } from 'react';

export interface CursorPosition {
  x: number;
  y: number;
}

export function useCursorPosition() {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;

    setIsMobile(checkMobile());

    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { position, isMobile };
}

