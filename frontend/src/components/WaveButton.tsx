import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'error' | 'light';
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const WaveButton: React.FC<WaveButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  size = 'md',
  type = 'button',
  icon,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colors = {
    primary: {
      bg: '#1B4332',
      text: '#FFFFFF',
      waves: ['#2D6A4F', '#40916C', '#52B788'],
    },
    secondary: {
      bg: '#2D6A4F',
      text: '#FFFFFF',
      waves: ['#40916C', '#52B788', '#74C69D'],
    },
    accent: {
      bg: '#E8A838',
      text: '#1B4332',
      waves: ['#FFC300', '#FFD60A', '#FFF000'],
    },
    error: {
      bg: '#FF4B4B',
      text: '#FFFFFF',
      waves: ['#FF6B6B', '#FF8787', '#FFA8A8'],
    },
    outline: {
      bg: 'transparent',
      text: '#1B4332',
      waves: ['rgba(27,67,50,0.05)', 'rgba(27,67,50,0.1)', 'rgba(27,67,50,0.15)'],
      border: '2px solid rgba(27,67,50,0.2)'
    },
    ghost: {
      bg: 'transparent',
      text: '#1B4332',
      waves: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.06)'],
    },
    light: {
      bg: '#FFFFFF',
      text: '#1B4332',
      waves: ['#F0FDF4', '#DCFCE7', '#BBF7D0'],
    }
  };

  const currentVariant = colors[variant] || colors.primary;

  const sizeClasses = {
    xs: 'px-3 py-1.5 text-[10px] rounded-lg',
    sm: 'px-4 py-2 text-xs rounded-xl',
    md: 'px-6 py-3 text-sm rounded-2xl',
    lg: 'px-8 py-4 text-base rounded-[20px]',
    xl: 'px-10 py-5 text-lg rounded-[24px]',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave?.();
      }}
      whileTap={{ scale: 0.96 }}
      className={`relative overflow-hidden font-black tracking-tight flex items-center justify-center gap-2 group transition-all duration-300 ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        backgroundColor: variant === 'outline' || variant === 'ghost' ? 'transparent' : currentVariant.bg,
        color: currentVariant.text,
        border: (currentVariant as any).border || 'none',
      }}
    >
      <AnimatePresence>
        {!disabled && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {currentVariant.waves.map((waveColor, index) => (
              <motion.div
                key={index}
                initial={{ y: '100%', rotate: 0 }}
                animate={{ 
                  y: isHovered ? `${10 + index * 15}%` : '100%',
                  rotate: isHovered ? 360 : 0,
                }}
                transition={{
                  y: { type: 'spring', stiffness: 100, damping: 20, delay: index * 0.05 },
                  rotate: { duration: 3 + index, repeat: Infinity, ease: 'linear' }
                }}
                className="absolute left-[-50%] w-[200%] aspect-square"
                style={{
                  backgroundColor: waveColor,
                  borderRadius: '42%',
                  top: '0%',
                  opacity: 0.8 - index * 0.15,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <span className="relative z-10 flex items-center gap-2 transition-transform duration-300 group-hover:scale-105">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </motion.button>
  );
};

export default WaveButton;
