interface WaveDividerProps {
  fill: string; // 다음 섹션의 배경색
}

export function WaveDivider({ fill }: WaveDividerProps) {
  return (
    <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '100%', lineHeight: 0 }}>
      <svg viewBox="0 0 1440 110" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
        style={{ display: 'block', width: '100%' }}>
        <path
          d="M0,65 C90,20 180,105 270,62 C360,20 450,105 540,62 C630,20 720,105 810,62 C900,20 990,105 1080,62 C1170,20 1260,105 1350,62 C1395,42 1425,78 1440,62 L1440,110 L0,110 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
