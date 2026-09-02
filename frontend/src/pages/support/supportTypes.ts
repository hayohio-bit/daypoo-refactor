// ── 타입 ──────────────────────────────────────────────────────────────
export type SupportTab = 'faq' | 'inquiry' | 'myinquiry';
export type FaqCategory = '전체' | '배변 패턴 분석' | '이용방법' | '계정/보안';
export type InquiryStatus = '답변 대기' | '답변 완료';
export type InquiryCategory = '배변 패턴 분석 오류' | '기타';

export interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, '전체'>;
  q: string;
  a: string;
  num: string;
}

export interface Inquiry {
  id: string;
  category: InquiryCategory;
  title: string;
  content: string;
  status: InquiryStatus;
  createdAt: string;
  answer?: string;
}

// ── 데이터 (Fallback용) ──────────────────────────────────────────────────
export const FALLBACK_FAQ: FaqItem[] = [
  {
    id: 'f1',
    num: '01',
    category: '배변 패턴 분석',
    q: '배변 패턴 분석 결과는 의학적으로 정확한가요?',
    a: '본 서비스의 패턴 분석은 재미와 참고를 위한 장 컨디션 체크 및 패턴 기록일 뿐, 전문적인 의학적 진단을 대신할 수 없습니다.',
  },
  {
    id: 'f2',
    num: '02',
    category: '배변 패턴 분석',
    q: '브리스톨 척도란 무엇인가요?',
    a: '브리스톨 척도는 대변의 형태를 7가지 유형으로 분류한 기준입니다. Day.Poo는 이를 기반으로 배변 패턴을 시각화합니다.',
  },
  {
    id: 'f3',
    num: '03',
    category: '이용방법',
    q: '화장실 정보가 최신화되나요?',
    a: '공공데이터 API와 자동으로 동기화되어 이름, 주소, 개방시간 등이 항상 최신 상태로 유지됩니다.',
  },
  {
    id: 'f4',
    num: '04',
    category: '이용방법',
    q: '방문 인증은 어떻게 하나요?',
    a: "지도에서 화장실 선택 후 '방문 인증하기' 버튼을 통해 상태와 색상을 기록하면 💩 마커로 변합니다.",
  },
];

export const CATEGORIES: FaqCategory[] = ['전체', '배변 패턴 분석', '이용방법', '계정/보안'];

export const INQUIRY_CATEGORY_OPTIONS: InquiryCategory[] = ['배변 패턴 분석 오류', '기타'];
