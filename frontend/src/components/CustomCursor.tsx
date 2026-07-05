import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useCursorPosition } from '../hooks/useCursorPosition';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

export function CustomCursor() {
  const { position, isMobile } = useCursorPosition();
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const isMagneticRef = useRef(false);
  const requestRef = useRef<number | null>(null);

  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);

  const [isMagnetic, setIsMagnetic] = useState(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    isMagneticRef.current = isMagnetic;
  }, [isMagnetic]);

  useEffect(() => {
    const animate = () => {
      const t = isMagneticRef.current ? 0.5 : 0.35;
      const nextX = lerp(lastPosRef.current.x, positionRef.current.x, t);
      const nextY = lerp(lastPosRef.current.y, positionRef.current.y, t);
      lastPosRef.current = { x: nextX, y: nextY };
      setRingPos({ x: nextX, y: nextY });
      requestRef.current = window.requestAnimationFrame(animate);
    };

    requestRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (requestRef.current != null) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const id = rippleIdRef.current++;
      const ripple: Ripple = { id, x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, ripple]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>("[data-magnetic-target='true']");
    if (!target) {
      setIsMagnetic(false);
      return;
    }

    const rect = target.getBoundingClientRect();
    const dx = position.x - (rect.left + rect.width / 2);
    const dy = position.y - (rect.top + rect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    setIsMagnetic(distance < 120);
  }, [position]);

  if (isMobile) {
    return null;
  }

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-50 rounded-full border border-amber/50 bg-amber/10 backdrop-blur-[2px]"
        style={{
          width: isMagnetic ? 72 : 36,
          height: isMagnetic ? 72 : 36,
          left: ringPos.x - (isMagnetic ? 36 : 18),
          top: ringPos.y - (isMagnetic ? 36 : 18),
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.8 }}
      />

      <AnimatePresence>
        {ripples.map((ripple) => (
          <div key={ripple.id}>
            {[1, 2].map((layer) => (
              <motion.div
                key={layer}
                className="pointer-events-none fixed z-40 rounded-full border border-amber/40 bg-amber/5"
                initial={{ opacity: 0.8, scale: 0 }}
                animate={{
                  opacity: 0,
                  scale: 2 + layer * 0.5,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 + layer * 0.15, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: 80,
                  height: 80,
                  left: ripple.x - 40,
                  top: ripple.y - 40,
                }}
                onAnimationComplete={() => {
                  if (layer === 2) {
                    setRipples((prev) => prev.filter((it) => it.id !== ripple.id));
                  }
                }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </>
  );
}

