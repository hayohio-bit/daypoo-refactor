-- FAQ 카테고리 표기 변경에 따른 기존 행 이관
-- 프론트엔드(SupportPage)는 category 완전 일치로 탭을 필터링하므로,
-- 옛 표기가 남은 행은 '전체' 탭에만 보이고 해당 카테고리 탭에서 사라진다.
UPDATE faqs SET category = '배변 패턴 분석' WHERE category = '배변 패턴/AI분석';
