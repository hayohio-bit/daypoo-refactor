import { describe, expect, it } from 'vitest';
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('Error 의 메시지를 그대로 사용한다', () => {
    expect(getErrorMessage(new Error('이미 등록된 후기입니다.'), '기본 문구')).toBe(
      '이미 등록된 후기입니다.',
    );
  });

  it('메시지가 비어 있는 Error 는 기본 문구로 대체한다', () => {
    expect(getErrorMessage(new Error('   '), '기본 문구')).toBe('기본 문구');
  });

  it('문자열이 던져진 경우에도 그대로 사용한다', () => {
    expect(getErrorMessage('요청이 거부되었습니다.', '기본 문구')).toBe('요청이 거부되었습니다.');
  });

  it('Error 도 문자열도 아닌 값은 기본 문구로 대체한다', () => {
    expect(getErrorMessage(undefined, '기본 문구')).toBe('기본 문구');
    expect(getErrorMessage({ code: 'C001' }, '기본 문구')).toBe('기본 문구');
  });

  it('기본 문구를 지정하지 않으면 공통 문구로 대체한다', () => {
    expect(getErrorMessage(undefined)).toBe(DEFAULT_ERROR_MESSAGE);
    expect(getErrorMessage(new Error('  '))).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('기본 문구를 생략해도 Error 메시지와 문자열은 그대로 사용한다', () => {
    expect(getErrorMessage(new Error('요청 시간이 초과되었습니다.'))).toBe(
      '요청 시간이 초과되었습니다.',
    );
    expect(getErrorMessage('동기화가 중단되었습니다.')).toBe('동기화가 중단되었습니다.');
  });
});
