import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  Activity,
  Calendar,
  Crown,
  Lock,
  LogOut,
  Package,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import type { UserResponse } from '../../types/api';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  },
});

export interface SettingsTabProps {
  user: UserResponse | null;
  refreshUser: () => void;
  logout: () => Promise<void>;
  deleteMe: () => Promise<void>;
}

export const SettingsTab = ({ user, refreshUser, logout, deleteMe }: SettingsTabProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [modalType, setModalType] = useState<
    'nickname' | 'password' | 'withdraw' | 'cancelSubscription' | null
  >(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    try {
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error('Logout failed:', err);
      navigate('/');
    }
  };

  const handleNicknameChange = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.patch('/auth/profile', { nickname: inputValue });
      alert('닉네임이 변경되었습니다.');
      refreshUser();
      setModalType(null);
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.patch('/auth/password', { password: inputValue });
      alert('비밀번호가 변경되었습니다.');
      setModalType(null);
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setIsSubmitting(true);
    try {
      await deleteMe();
      alert('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');
      setModalType(null);
    } catch (err: any) {
      console.error('회원 탈퇴 에러:', err);
      alert(err.message || '회원 탈퇴 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSubscriptionInfo = async () => {
    try {
      const data = await api.get('/subscriptions/me');
      setSubscriptionInfo(data);
    } catch (err: any) {
      console.error('구독 정보 조회 실패:', err);
      alert('구독 정보를 불러올 수 없습니다.');
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        '정말로 구독을 해지하시겠습니까?\n\n해지 후에도 만료일까지는 서비스를 이용하실 수 있습니다.',
      )
    )
      return;

    setIsSubmitting(true);
    try {
      await api.post('/subscriptions/cancel');
      alert('구독이 해지되었습니다. 만료일까지 서비스를 이용하실 수 있습니다.');
      setModalType(null);
      await refreshUser();
      await loadSubscriptionInfo();
    } catch (err: any) {
      console.error('구독 해지 에러:', err);
      alert(err.message || '구독 해지에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      title: '기본 정보',
      items: [
        {
          label: '이메일 주소',
          value: user?.email || '데이터 없음',
          icon: <Package size={18} />,
          action: null,
        },
        {
          label: '현재 닉네임',
          value: user?.nickname || '데이터 없음',
          icon: <Activity size={18} />,
          action: '변경',
          onClick: () => {
            setInputValue(user?.nickname || '');
            setModalType('nickname');
          },
        },
        {
          label: '접속 비밀번호',
          value: '********',
          icon: <Lock size={18} />,
          action: '설정',
          onClick: () => {
            setInputValue('');
            setModalType('password');
          },
        },
      ],
    },
    {
      title: '멤버십 및 계정',
      items: [
        {
          label: '멤버십 등급',
          value: (() => {
            if (!user) return 'FREE 일반 회원';
            if (user.isPro && user.subscription) {
              const plan = user.subscription.plan;
              if (plan === 'PRO') return 'PRO 멤버십';
              if (plan === 'PREMIUM') return 'PREMIUM 멤버십';
              return `${plan} 멤버십`;
            }
            return 'FREE 일반 회원';
          })(),
          icon: <Trophy size={18} />,
          action: '관리',
          onClick: async () => {
            if (!user?.isPro || !user?.subscription) {
              navigate('/premium');
            } else {
              await loadSubscriptionInfo();
              setModalType('cancelSubscription');
            }
          },
        },
        {
          label: '계정 생성일',
          value: user?.createdAt ? (user.createdAt as string).split('T')[0] : '-',
          icon: <Calendar size={18} />,
          action: null,
        },
      ],
    },
  ];

  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8"
    >
      {sections.map((section, idx) => (
        <motion.div
          key={idx}
          variants={fadeUp(idx * 0.1)}
          className="bg-white rounded-[24px] sm:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-2 sm:p-4"
        >
          <div className="px-4 sm:px-10 pt-6 sm:pt-10 pb-4 sm:pb-6">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.25em] mb-2">
              {section.title}
            </p>
          </div>
          <div className="px-6 pb-6">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 sm:p-6 rounded-[24px] sm:rounded-3xl hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shadow-inner shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-0.5 sm:mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm sm:text-lg font-black text-[#1A2B27] tracking-tight truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
                {item.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={item.onClick}
                    className="px-4 py-2 sm:px-6 sm:py-3 rounded-[14px] sm:rounded-2xl text-[11px] sm:text-sm font-black bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all shrink-0 ml-2"
                  >
                    {item.action}
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div variants={fadeUp(0.3)} className="flex flex-col gap-4 mb-20">
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="flex-[2] py-6 rounded-[32px] bg-white border border-gray-100 text-gray-500 font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-gray-100/20 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={20} /> 로그아웃 하기
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setInputValue('');
              setModalType('withdraw');
            }}
            className="flex-1 py-6 rounded-[32px] bg-red-50 border border-red-100/50 text-red-400 font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-red-100/20 hover:bg-red-100/30 transition-colors"
          >
            <Trash2 size={18} /> 회원 탈퇴
          </motion.button>
        </div>
        <p className="text-center text-xs text-gray-300 font-black uppercase tracking-[0.3em] py-8">
          DayPoo App Version 2.5.0 (Standard)
        </p>
      </motion.div>

      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-10 shadow-3xl border border-white"
            >
              {modalType === 'cancelSubscription' ? (
                <>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-amber-50 text-amber-600">
                    <Crown size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1A2B27] mb-2">멤버십 구독 관리</h3>

                  {subscriptionInfo ? (
                    <div className="space-y-6 mb-8 text-left">
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">구독 플랜</span>
                          <span
                            className={`font-black text-lg ${
                              subscriptionInfo.plan === 'PREMIUM'
                                ? 'text-[#1B4332]'
                                : 'text-[#E8A838]'
                            }`}
                          >
                            {subscriptionInfo.plan} 멤버십
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">구독 상태</span>
                          <span
                            className={`font-black text-sm ${
                              subscriptionInfo.status === 'ACTIVE'
                                ? 'text-emerald-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {subscriptionInfo.status === 'ACTIVE'
                              ? '활성'
                              : subscriptionInfo.status === 'CANCELLED'
                              ? '해지됨'
                              : '만료'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">만료일</span>
                          <span className="font-black text-sm text-[#1A2B27]">
                            {subscriptionInfo.endDate
                              ? new Date(subscriptionInfo.endDate).toLocaleDateString('ko-KR')
                              : '-'}
                          </span>
                        </div>
                        {subscriptionInfo.daysRemaining !== null && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">남은 기간</span>
                            <span className="font-black text-sm text-emerald-600">
                              {subscriptionInfo.daysRemaining}일
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">자동 갱신</span>
                          <span
                            className={`font-black text-sm ${
                              subscriptionInfo.isAutoRenewal ? 'text-emerald-600' : 'text-gray-400'
                            }`}
                          >
                            {subscriptionInfo.isAutoRenewal ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>

                      {subscriptionInfo.status === 'ACTIVE' && (
                        <p className="text-xs font-medium text-gray-400 leading-relaxed">
                          구독을 해지하시면 만료일까지 서비스를 이용하실 수 있습니다.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-400">구독 정보를 불러오는 중...</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalType(null)}
                      className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                    >
                      닫기
                    </button>
                    {subscriptionInfo?.status === 'ACTIVE' && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-red-500 text-white font-black rounded-[20px] shadow-xl shadow-red-900/20 disabled:opacity-50 hover:bg-red-600 transition-colors"
                      >
                        {isSubmitting ? '처리 중...' : '구독 해지'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${
                      modalType === 'withdraw' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {modalType === 'nickname' ? (
                      <Activity size={28} />
                    ) : modalType === 'password' ? (
                      <Lock size={28} />
                    ) : (
                      <Trash2 size={28} />
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-[#1A2B27] mb-2 text-center">
                    {modalType === 'nickname'
                      ? '새로운 닉네임'
                      : modalType === 'password'
                      ? '비밀번호 재설정'
                      : '계정 삭제'}
                  </h3>
                  <p className="text-xs font-medium text-gray-400 mb-8 leading-relaxed text-center">
                    {modalType === 'nickname'
                      ? '부르고 싶은 멋진 닉네임을 입력해주세요.'
                      : modalType === 'password'
                      ? '보안을 위해 강력한 비밀번호를 설정하세요.'
                      : '탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.'}
                  </p>

                  {modalType !== 'withdraw' && (
                    <input
                      type={modalType === 'nickname' ? 'text' : 'password'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={modalType === 'nickname' ? '닉네임 입력' : '비밀번호 입력'}
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[20px] mb-8 outline-none focus:border-emerald-500/30 font-black text-lg text-[#1A2B27] placeholder:text-gray-400"
                    />
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalType(null)}
                      className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                    >
                      닫기
                    </button>
                    <button
                      onClick={
                        modalType === 'nickname'
                          ? handleNicknameChange
                          : modalType === 'password'
                          ? handlePasswordChange
                          : handleWithdraw
                      }
                      disabled={isSubmitting}
                      className={`flex-1 py-4 text-white font-black rounded-[20px] shadow-xl disabled:opacity-50 transition-colors ${
                        modalType === 'withdraw'
                          ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20'
                          : 'bg-[#1B4332] hover:bg-[#2D6A4F] shadow-green-900/20'
                      }`}
                    >
                      {isSubmitting ? '처리 중...' : '확인'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default SettingsTab;
