-- 수익화(결제) 기능 제거에 따른 잔여 데이터 정리

-- 문의 유형: 삭제된 PAYMENT_ITEM 값을 OTHERS 로 이관 (Inquiry.type 은 EnumType.STRING 저장)
UPDATE inquiries SET type = 'OTHERS' WHERE type = 'PAYMENT_ITEM';

-- FAQ: 결제·환불 안내 항목은 삭제하고, '결제/아바타' 카테고리의 나머지 항목은 '이용방법'으로 이동
DELETE FROM faqs
WHERE category = '결제/아바타'
  AND (question LIKE '%환불%' OR answer LIKE '%환불%'
       OR question LIKE '%결제%' OR answer LIKE '%결제%');

UPDATE faqs SET category = '이용방법' WHERE category = '결제/아바타';
