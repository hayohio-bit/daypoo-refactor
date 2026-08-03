import { motion } from 'framer-motion';
import type { UserResponse } from '../../types/api';
import { type TabKey } from './myPageCommons';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  },
});

export interface HomeTabProps {
  user: UserResponse | null;
  refreshUser: () => Promise<void>;
  onTabChange?: (k: TabKey) => void;
  records?: any[];
}

export const HomeTab = ({
  user,
  refreshUser,
  onTabChange,
  records = [],
}: HomeTabProps) => {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8"
    >
      <motion.div
        variants={fadeUp(0)}
        className="bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px] items-center justify-center p-10"
      >
        <p className="text-gray-400 font-bold text-center">
          홈 기능이 준비 중입니다.
        </p>
      </motion.div>
    </motion.div>
  );
};
export default HomeTab;
