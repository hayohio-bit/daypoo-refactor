import { useEffect, useRef } from 'react';

interface Layer {
  color: string;
  delay: number;
  wave: number;
}

interface PaintCurtainProps {
  isVisible: boolean;
  onComplete?: () => void;
  phase: 'down' | 'up' | 'idle';
}

const LAYERS: Layer[] = [
  { color: '#E8A838', delay: 0,  wave: 50 }, // 앰버 먼저
  { color: '#1B4332', delay: 90, wave: 40 }, // 딥그린 뒤따라
];

const DUR = 650;
const EASE = (t: number): number =>
  t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;

function buildPath(progress: number, W: number, H: number, wave: number): string {
  const p = EASE(Math.min(Math.max(progress, 0), 1));
  const bottom = p * (H + wave * 2);
  const w = wave * Math.sin(p * Math.PI);
  return [
    `M0,0`,
    `L${W},0`,
    `L${W},${bottom - w}`,
    `Q${W * 0.75},${bottom + w} ${W * 0.5},${bottom}`,
    `Q${W * 0.25},${bottom - w} 0,${bottom - w}`,
    `Z`,
  ].join(' ');
}

export function PaintCurtain({ isVisible, onComplete, phase }: PaintCurtainProps) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const rafRef  = useRef<number>(0);

  useEffect(() => {
    if (phase === 'idle') return;

    const svg = svgRef.current;
    if (!svg) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // SVG viewBox를 실제 화면 크기로
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const paths = LAYERS.map((_, i) =>
      svg.querySelector<SVGPathElement>(`#paint-path-${i}`)!
    );

    const startTime = performance.now();
    cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const elapsed = now - startTime;

      LAYERS.forEach((layer, i) => {
        const t = phase === 'down'
          ? (elapsed - layer.delay) / DUR
          : 1 - (elapsed - ((LAYERS.length - 1 - i) * 90)) / DUR;

        paths[i].setAttribute('d', buildPath(t, W, H, layer.wave));
      });

      const lastEnd = phase === 'down'
        ? LAYERS[LAYERS.length - 1].delay + DUR
        : (LAYERS.length - 1) * 90 + DUR;

      if (elapsed < lastEnd) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // 완전히 덮음 or 완전히 걷힘
        LAYERS.forEach((layer, i) => {
          const finalT = phase === 'down' ? 1 : 0;
          paths[i].setAttribute('d', buildPath(finalT, W, H, layer.wave));
        });
        onComplete?.();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (!isVisible) return null;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
      preserveAspectRatio="none"
    >
      <defs>
        {LAYERS.map((layer, i) => (
          <clipPath key={i} id={`paint-clip-${i}`}>
            <path id={`paint-path-${i}`} d="M0,0 Z" />
          </clipPath>
        ))}
      </defs>

      {LAYERS.map((layer, i) => (
        <rect
          key={i}
          x="0" y="0"
          width="100%" height="100%"
          fill={layer.color}
          clipPath={`url(#paint-clip-${i})`}
        />
      ))}
    </svg>
  );
}