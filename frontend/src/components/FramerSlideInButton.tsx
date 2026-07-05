import { motion } from 'framer-motion';

interface FramerSlideInButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
}

export function FramerSlideInButton({ 
  children, 
  onClick, 
  primary = false,
  className = "" 
}: FramerSlideInButtonProps) {
  return (
    <motion.button
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={`relative group overflow-hidden rounded-full cursor-pointer px-10 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${className}`}
      style={{
        backgroundColor: primary ? 'var(--green-deep)' : 'rgba(255, 255, 255, 0.05)',
        border: primary ? 'none' : '1.5px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: primary ? 'none' : 'blur(10px)',
        color: '#FFFFFF'
      }}
    >
      {/* 1. Expansion Layer (BG Fill) */}
      <motion.div
        variants={{
          initial: { y: "100%", x: "-50%", scale: 0 },
          hover: { y: "-50%", x: "-50%", scale: 12 },
        }}
        transition={{ 
          type: "spring", 
          stiffness: 150, 
          damping: 25,
          mass: 0.5
        }}
        className="absolute left-1/2 top-full w-12 h-12 rounded-full pointer-events-none z-0"
        style={{
          backgroundColor: primary ? 'var(--green-mid)' : 'rgba(255, 255, 255, 0.15)',
        }}
      />

      {/* 2. Content Layer (Text & Icon) */}
      <motion.div 
        className="relative z-10 flex items-center justify-center gap-3"
        variants={{
          initial: { x: 0 },
          hover: { x: -4 }
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </motion.button>
  );
}
