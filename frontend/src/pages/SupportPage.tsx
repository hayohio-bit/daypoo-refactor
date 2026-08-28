import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  FileText,
  Filter,
  LifeBuoy,
  MessageSquare,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { WaveDivider } from '../components/WaveDivider';
import { getAccessToken } from '../services/apiClient';
import { getFaqs } from '../services/supportService';
import { ModernHistory } from './support/ModernHistory';
import { ModernInquiryForm } from './support/ModernInquiryForm';
import { ModernSearch } from './support/ModernSearch';
import { TrendyFaqItem } from './support/TrendyFaqItem';
import { cardVariants, containerVariants } from './support/supportAnimations';
import {
  CATEGORIES,
  FALLBACK_FAQ,
  type FaqCategory,
  type FaqItem,
  type SupportTab,
} from './support/supportTypes';

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function SupportPage({
  openAuth,
}: {
  openAuth: (mode: 'login' | 'signup', callback?: () => void) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = (searchParams.get('tab') as SupportTab) || 'faq';

  const [activeTab, setActiveTab] = useState<SupportTab>(initialTab);
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [faqData, setFaqData] = useState<FaqItem[]>(FALLBACK_FAQ);

  useEffect(() => {
    getFaqs<FaqItem>()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setFaqData(data);
      })
      .catch((err) => console.warn('Using fallback FAQs:', err));
  }, []);

  const filteredFaqs = useMemo(() => {
    return faqData.filter((item) => {
      const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
      const matchesSearch =
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqData, activeCategory, searchQuery]);

  const handleTabChange = (k: SupportTab) => {
    if (k !== 'faq') {
      const token = getAccessToken();
      if (!token) {
        openAuth?.('login', () => {
          setActiveTab(k);
          setSearchParams({ tab: k });
        });
        return;
      }
    }
    setActiveTab(k);
    setSearchParams({ tab: k });
  };

  return (
    <div className="min-h-screen bg-white text-[#1A2B27] font-pretendard selection:bg-[#52B788]/20">
      <Navbar openAuth={openAuth} />

      {/* Hero Section */}
      <section className="relative pt-[100px] sm:pt-[180px] pb-[40px] sm:pb-[80px] px-4 sm:px-6 overflow-hidden bg-[#F8FAF9]">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#52B788] blur-[140px] rounded-full opacity-[0.1]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#E8A838] blur-[140px] rounded-full opacity-[0.08]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#1B4332]/5 rounded-full mb-10 border border-[#1B4332]/5"
          >
            <Sparkles size={14} className="text-[#E8A838]" />
            <span className="text-[12px] font-black text-[#1B4332] uppercase tracking-[0.25em]">
              Customer Support
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl sm:text-7xl md:text-8xl font-black mb-10 sm:mb-16 leading-[1.1] sm:leading-[1] tracking-tighter text-[#1A2B27]"
          >
            <div className="overflow-hidden py-2">
              <motion.span
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                우리가 무엇을
              </motion.span>
            </div>
            <div className="overflow-hidden py-2 -mt-2">
              <motion.span
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="block text-transparent bg-clip-text bg-[length:300%_auto] bg-gradient-to-r from-[#1B4332] via-[#E8A838] to-[#52B788] animate-text-shimmer"
              >
                도와드릴까요?
              </motion.span>
            </div>
          </motion.h1>

          <ModernSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
        <WaveDivider fill="white" />
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-4 sm:pt-[60px] pb-[80px] sm:pb-[120px] flex flex-col lg:flex-row gap-8 sm:gap-16">
          <aside className="w-full lg:w-[260px] shrink-0">
            <div className="sticky top-[120px] space-y-8 lg:space-y-12 max-w-full">
              <div className="flex flex-wrap lg:flex-col gap-3 pb-2">
                {[
                  {
                    id: 'faq' as const,
                    label: '자주 묻는 질문',
                    icon: <MessageSquare size={19} />,
                  },
                  { id: 'inquiry' as const, label: '1:1 문의하기', icon: <Plus size={19} /> },
                  {
                    id: 'myinquiry' as const,
                    label: '나의 문의 내역',
                    icon: <FileText size={19} />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center justify-between group px-5 sm:px-6 py-3.5 sm:py-5 rounded-2xl sm:rounded-[22px] transition-all duration-300 relative overflow-visible flex-grow lg:flex-grow-0 ${activeTab === tab.id ? 'bg-[#1B4332] text-white shadow-lg lg:shadow-2xl scale-[1.02]' : 'bg-[#f4f9f6] hover:bg-[#eaf4ee] text-[#5C6B68]'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                      <span
                        className={
                          activeTab === tab.id
                            ? 'text-[#52B788]'
                            : 'text-[#5C6B68]/40 group-hover:text-[#52B788]'
                        }
                      >
                        {tab.icon}
                      </span>
                      <span className="text-[13px] sm:text-[15px] font-black tracking-tight">
                        {tab.label}
                      </span>
                    </div>
                    <ArrowRight
                      size={16}
                      className={`hidden lg:block relative z-10 transition-transform duration-500 ${activeTab === tab.id ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}
                    />
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {activeTab === 'faq' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-2.5 px-3 text-[11px] font-black text-[#5C6B68]/40 uppercase tracking-[0.2em]">
                      <Filter size={13} /> CATEGORIES
                    </div>
                    <div className="flex flex-wrap lg:flex-col gap-2 pb-2 px-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-full lg:rounded-2xl text-[12px] sm:text-[14px] font-black text-left transition-all ${activeCategory === cat ? 'bg-[#52B788]/15 text-[#1B4332] shadow-sm' : 'bg-transparent text-[#5C6B68]/50 hover:text-[#1A2B27] hover:bg-[#f4f9f6]'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="hidden lg:block bg-gradient-to-br from-[#1B4332] to-[#0A1F17] rounded-[36px] p-8 text-white overflow-hidden relative group shadow-2xl">
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#52B788]/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <LifeBuoy className="text-[#52B788]" size={24} />
                  </div>
                  <h4 className="text-[17px] font-black mb-2">도움이 필요하신가요?</h4>
                  <p className="text-[13px] text-white/50 leading-relaxed mb-6 font-medium">
                    평일 09:00 - 18:00 운영
                    <br />
                    친밀하고 정확한 상담
                  </p>
                  <button
                    onClick={() => navigate('/privacy')}
                    className="px-5 py-2.5 rounded-xl bg-[#52B788] text-[#1B4332] text-[12px] font-black hover:bg-white transition-colors duration-300"
                  >
                    운영정책 전체보기
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* 4번 효과: AnimatePresence를 사용한 탭 슬라이드 전환 */}
            <AnimatePresence mode="wait">
              {activeTab === 'faq' && (
                <motion.div
                  key="faq"
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-10 px-2 lg:px-0">
                    <div className="p-4 bg-[#1B4332]/5 rounded-[22px] text-[#1B4332]">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[#1A2B27] tracking-tight">
                        {activeCategory}
                      </h2>
                      <p className="text-[13px] font-bold text-[#5C6B68]/40">
                        {filteredFaqs.length}개의 정제된 답변이 확인되었습니다.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((item) => (
                        <TrendyFaqItem
                          key={item.id}
                          item={item}
                          isOpen={openFaqId === item.id}
                          onToggle={() => setOpenFaqId(openFaqId === item.id ? null : item.id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-24 bg-[#f8faf9]/50 rounded-[44px] border border-black/[0.03]">
                        <div className="text-5xl mb-6">🏜️</div>
                        <p className="text-[#5C6B68]/40 font-black text-lg">
                          해당 키워드의 검색 결과가 없습니다
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'inquiry' && (
                <motion.div
                  key="inquiry"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ModernInquiryForm onSuccess={() => handleTabChange('myinquiry')} />
                </motion.div>
              )}

              {activeTab === 'myinquiry' && (
                <motion.div
                  key="myinquiry"
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-amber-100 rounded-[22px] text-amber-600 shadow-sm">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[#1A2B27]">나의 문의 내역</h2>
                      <p className="text-[13px] font-bold text-[#5C6B68]/40">
                        최근 3개월간의 내역입니다.
                      </p>
                    </div>
                  </div>
                  <ModernHistory />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <WaveDivider fill="#111e18" />
      </main>

      <Footer />
    </div>
  );
}
