import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

export function PrivacyPage() {
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
            <div className="w-12 h-12 rounded-2xl bg-[#fdf3de] flex items-center justify-center">
              <Lock className="text-[#b5810f]" size={24} />
            </div>
            <h1 className="text-3xl font-black text-[#1A2B27]">개인정보처리방침</h1>
          </div>

          <div className="space-y-6 text-[#1A2B27]/70 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-bold text-[#1A2B27] mb-3">개인정보의 수집 및 이용 목적</h2>
              <p>DayPoo(이하 "서비스")는 이용자의 개인정보를 다음의 목적을 위해 수집하고 이용합니다.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>서비스 제공 및 관리: 회원 가입 의사 확인, 본인 식별 및 인증, 회원 자격 유지 관리 등</li>
                <li>마케팅 및 광고에의 활용: 신규 서비스 및 이벤트 정보 안내 등 (선택 시)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A2B27] mb-3">수집하는 개인정보의 항목</h2>
              <p>1. 필수항목: 이메일 주소, 비밀번호, 닉네임, 생년월일</p>
              <p>2. 선택항목: 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보 등</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A2B27] mb-3">개인정보의 보유 및 이용 기간</h2>
              <p>이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체없이 파기합니다. 단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 관련 법령에서 정한 일정 기간 동안 보관합니다.</p>
            </section>

            <div className="pt-10 border-t border-[#d4e8db] text-[10px]">
              <p>최초 공고일자: 2026년 3월 18일</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
