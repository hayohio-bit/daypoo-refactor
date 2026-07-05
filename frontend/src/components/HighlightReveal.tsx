import React, { useRef, useEffect, useState, startTransition } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

interface HighlightRevealProps {
  text: string;
  highlightColor?: string;
  textColor?: string;
  highlightStyle?: "underline" | "strikethrough" | "circle" | "box";
  animationDuration?: number;
  animationDelay?: number;
  strokeWidth?: number;
  opacity?: number;
  translateY?: number; // 위아래 미세 조정용
  className?: string;
  style?: React.CSSProperties;
}

export function HighlightReveal({
  text,
  highlightColor = "#E8A838",
  textColor = "inherit",
  highlightStyle = "underline",
  animationDuration = 1.5,
  animationDelay = 0.5,
  strokeWidth = 12,
  opacity = 0.4,
  translateY = 0,
  className = "",
  style = {},
}: HighlightRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });
  const controls = useAnimation();
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        startTransition(() => {
          setTextDimensions({ width: rect.width, height: rect.height });
        });
      }
    };
    
    updateDimensions();
    // 윈도우 리사이즈 대응
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [text]);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const getHighlightPath = () => {
    const { width, height } = textDimensions;
    const paddingX = strokeWidth / 2;
    // 텍스트 아래쪽 여백을 고려한 기본 y 좌표
    const baseLineY = height - (strokeWidth / 4) + translateY;
    
    switch (highlightStyle) {
      case "underline":
        // 훨씬 더 생동감 넘치고 '손으로 그린 듯한' 지그재그 마커 느낌의 밑줄
        return `M ${paddingX} ${baseLineY} 
                C ${width * 0.2} ${baseLineY - (strokeWidth / 3)}, 
                  ${width * 0.4} ${baseLineY + (strokeWidth / 2)}, 
                  ${width * 0.6} ${baseLineY - (strokeWidth / 4)} 
                S ${width * 0.85} ${baseLineY + (strokeWidth / 3)}, 
                  ${width - paddingX} ${baseLineY + 1}`;
      case "strikethrough":
        const midY = (height / 2) + translateY;
        return `M ${paddingX} ${midY} Q ${width * 0.25} ${midY - 2} ${width * 0.5} ${midY + 1} Q ${width * 0.75} ${midY - 1} ${width - paddingX} ${midY}`;
      case "circle":
        const centerX = width / 2;
        const centerY = (height / 2) + translateY;
        const rx = (width - paddingX) / 2;
        const ry = (height - paddingX) / 2;
        return `M ${centerX - rx} ${centerY} Q ${centerX} ${centerY - ry - 4} ${centerX + rx} ${centerY} Q ${centerX + rx + 2} ${centerY + ry} ${centerX} ${centerY + ry + 2} Q ${centerX - rx - 2} ${centerY} ${centerX - rx} ${centerY}`;
      case "box":
        return `M ${paddingX} ${paddingX + translateY + 2} Q ${width * 0.25} ${paddingX + translateY - 2} ${width * 0.5} ${paddingX + translateY + 1} Q ${width * 0.75} ${paddingX + translateY - 1} ${width - paddingX} ${paddingX + translateY + 2} L ${width - paddingX + 1} ${height - paddingX + translateY - 1} Q ${width * 0.75} ${height - paddingX + translateY + 2} ${width * 0.5} ${height - paddingX + translateY - 1} Q ${width * 0.25} ${height - paddingX + translateY + 1} ${paddingX} ${height - paddingX + translateY - 1} Z`;
      default:
        return "";
    }
  };

  // SVG 주변으로 여백을 주어 잘림 현상 방지
  const svgPadding = strokeWidth + 10;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ ...style }}
    >
      <span style={{ color: textColor, position: "relative", zIndex: 1 }}>
        {text}
      </span>
      
      {textDimensions.width > 0 && (
        <motion.svg
          style={{
            position: "absolute",
            top: -svgPadding / 2,
            left: -svgPadding / 2,
            width: textDimensions.width + svgPadding,
            height: textDimensions.height + svgPadding,
            pointerEvents: "none",
            zIndex: 0,
          }}
          viewBox={`-${svgPadding / 2} -${svgPadding / 2} ${textDimensions.width + svgPadding} ${textDimensions.height + svgPadding}`}
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delay: animationDelay } },
          }}
        >
          <motion.path
            d={getHighlightPath()}
            stroke={highlightColor}
            strokeWidth={strokeWidth}
            fill={highlightStyle === "box" ? highlightColor : "none"}
            fillOpacity={highlightStyle === "box" ? opacity : 0}
            strokeOpacity={opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={controls}
            variants={{
              hidden: { pathLength: 0 },
              visible: { 
                pathLength: 1, 
                transition: { 
                  duration: animationDuration, 
                  ease: [0.16, 1, 0.3, 1], 
                  delay: animationDelay 
                } 
              },
            }}
            style={{ filter: "url(#markerBlur)" }}
          />
          <defs>
            <filter id="markerBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </motion.svg>
      )}
    </div>
  );
}
