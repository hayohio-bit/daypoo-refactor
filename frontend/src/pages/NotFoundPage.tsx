import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Home } from 'lucide-react';

// ── FuzzyText (인라인 — 별도 파일로 분리해도 됩니다) ──────────────────
interface FuzzyTextProps {
  text: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  baseIntensity?: number;
  hoverIntensity?: number;
  enableHover?: boolean;
  fuzzRange?: number;
  className?: string;
  style?: React.CSSProperties;
}

function FuzzyText({
  text,
  fontSize = 80,
  fontWeight = 900,
  fontFamily = 'system-ui, -apple-system, sans-serif',
  color = '#ffffff',
  lineHeight = 1.25,
  align = 'left',
  baseIntensity = 0.1,
  hoverIntensity = 0.5,
  enableHover = true,
  fuzzRange = 28,
  className,
  style,
}: FuzzyTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let raf: number;
    let isCancelled = false;
    let hovering = false;

    const init = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (isCancelled) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const fontStr = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const lineH = Math.ceil(fontSize * lineHeight);
      const lines = text.split(/\r?\n/);

      const offscreens = lines.map((line) => {
        const off = document.createElement('canvas');
        const octx = off.getContext('2d')!;
        octx.font = fontStr;
        const lw = Math.ceil(octx.measureText(line).width);
        off.width = lw + 20;
        off.height = lineH;
        octx.font = fontStr;
        octx.textBaseline = 'top';
        octx.fillStyle = color;
        octx.fillText(line, 10, Math.floor((lineH - fontSize) * 0.1));
        return { canvas: off, width: lw };
      });

      const maxWidth = Math.max(...offscreens.map((o) => o.width)) + 20;
      const totalHeight = lineH * lines.length;

      canvas.style.width = `${maxWidth}px`;
      canvas.style.height = `${totalHeight}px`;
      canvas.width = Math.ceil(maxWidth * dpr);
      canvas.height = Math.ceil(totalHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (containerRef.current) {
        containerRef.current.style.width = `${maxWidth}px`;
        containerRef.current.style.height = `${totalHeight}px`;
      }

      const getXBase = (lw: number) => {
        if (align === 'center') return Math.max(0, Math.floor((maxWidth - lw - 20) / 2));
        if (align === 'right') return Math.max(0, maxWidth - lw - 20);
        return 0;
      };

      const run = () => {
        if (isCancelled) return;
        ctx.clearRect(0, 0, maxWidth, totalHeight);
        const intensity = enableHover && hovering ? hoverIntensity : baseIntensity;
        offscreens.forEach((off, idx) => {
          const yBase = idx * lineH;
          const xBase = getXBase(off.width);
          for (let j = 0; j < lineH; j++) {
            const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
            ctx.drawImage(off.canvas, 0, j, off.canvas.width, 1, xBase + dx, yBase + j, off.canvas.width, 1);
          }
        });
        raf = requestAnimationFrame(run);
      };
      run();

      if (enableHover) {
        const onEnter = () => { hovering = true; };
        const onLeave = () => { hovering = false; };
        canvas.addEventListener('mouseenter', onEnter);
        canvas.addEventListener('mouseleave', onLeave);
        return () => {
          canvas.removeEventListener('mouseenter', onEnter);
          canvas.removeEventListener('mouseleave', onLeave);
        };
      }
    };

    const cleanup = init();
    return () => {
      isCancelled = true;
      cancelAnimationFrame(raf);
      cleanup?.then?.((fn) => fn?.());
    };
  }, [text, fontSize, fontWeight, fontFamily, color, lineHeight, align, baseIntensity, hoverIntensity, enableHover, fuzzRange, containerWidth]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: 'inline-block', width: 'fit-content', maxWidth: '100%', position: 'relative', ...style }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', cursor: enableHover ? 'pointer' : 'default' }} />
    </div>
  );
}

// ── 404 Page ──────────────────────────────────────────────────────────
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0d1a14' }}
    >
      {/* 배경 글로우 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(27,67,50,0.6) 0%, transparent 70%)',
        }}
      />

      {/* 배경 워터마크 (선택 사항: 유지하되 이모지 없음) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ opacity: 0.02 }}
      >
        <span
          style={{
            fontSize: 'clamp(200px, 40vw, 500px)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.06em',
            lineHeight: 1,
          }}
        >
          404
        </span>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">

        {/* 404 — FuzzyText 글리치 */}
        <div style={{ marginBottom: '0px' }}>
          <FuzzyText
            text="404"
            fontFamily="SchoolSafetyNotification, sans-serif"
            fontSize={typeof window !== 'undefined' ? Math.min(160, window.innerWidth * 0.28) : 160}
            fontWeight={700}
            color="#E85D5D"
            baseIntensity={0.06}
            hoverIntensity={0.75}
            enableHover
            fuzzRange={36}
            align="center"
          />
        </div>

        {/* 서브 타이틀 — FuzzyText */}
        <div style={{ marginBottom: '8px' }}>
          <FuzzyText
            text="페이지를 찾지 못했습니다"
            fontFamily="SchoolSafetyNotification, sans-serif"
            fontSize={typeof window !== 'undefined' ? Math.min(32, window.innerWidth * 0.055) : 32}
            fontWeight={700}
            color="#ffffff"
            baseIntensity={0.1}
            hoverIntensity={0.5}
            enableHover
            fuzzRange={22}
            align="center"
          />
        </div>

        {/* 설명 */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.6,
            maxWidth: '400px',
            marginBottom: '32px',
          }}
        >
          요청하신 페이지가 존재하지 않거나<br />
          주소가 변경되었을 수 있습니다.
        </motion.p>

        {/* 버튼들 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => navigate('/main')}
            className="flex items-center justify-center gap-2 px-10 py-4 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
              color: '#fff',
              boxShadow: '0 6px 24px rgba(27,67,50,0.4)',
            }}
          >
            <Home size={18} />
            홈으로 이동
          </button>

          <button
            onClick={() => navigate('/map')}
            className="flex items-center justify-center gap-2 px-10 py-4 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: '#E8A838',
              color: '#1B4332',
              boxShadow: '0 6px 24px rgba(232,168,56,0.35)',
            }}
          >
            <MapPin size={18} />
            화장실 찾기
          </button>
        </motion.div>

        {/* 이전 페이지 버튼 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => navigate(-1)}
          className="mt-10 text-xs font-bold transition-all hover:text-white"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          이전 페이지로 돌아가기
        </motion.button>
      </div>
    </div>
  );
}
