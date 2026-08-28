// ── 애니메이션 베리언츠 ───────────────────────────────────────
export const cardVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
};

export const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const listItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 150, damping: 15 },
  },
};
