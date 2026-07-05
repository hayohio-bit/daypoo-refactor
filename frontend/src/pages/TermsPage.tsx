import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF9] py-10 sm:py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-[#1B4332] mb-8 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} /> 뒤로가기
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 shadow-sm border border-[#d4e8db]"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#eef5f0] flex items-center justify-center">
              <ShieldCheck className="text-[#1B4332]" size={24} />
            </div>
            <h1 className="text-3xl font-black text-[#1A2B27]">서비스 이용약관</h1>
          </div>

          <div className="space-y-6 text-[#1A2B27]/70 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-bold text-[#1A2B27] mb-3">제 1 조 (목적)</h2>
              <p>본 약관은 DayPoo(이하 "서비스")가 제공하는 인터넷 관련 서비스의 이용 조건 및 절차, 이용자와 서비스의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A2B27] mb-3">제 2 조 (용어의 정의)</h2>
              <p>1. "이용자"란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</p>
              <p>2. "회원"이란 서비스에 개인정보를 제공하여 회원 등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A2B27] mb-3">제 3 조 (약관의 효력 및 변경)</h2>
              <p>1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효율이 발생합니다.</p>
              <p>2. 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 약관을 개정할 수 있습니다.</p>
            </section>

            <div className="pt-10 border-t border-[#d4e8db] text-[10px]">
              <p>시행일자: 2026년 3월 18일</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
