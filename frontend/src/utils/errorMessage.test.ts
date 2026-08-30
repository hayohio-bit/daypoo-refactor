import { describe, expect, it } from 'vitest';
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('Error 의 메시지를 그대로 사용한다', () => {
    expect(getErrorMessage(new Error('이미 등록된 후기입니다.'))).toBe('이미 등록된 후기입니다.');
    expect(getErrorMessage(new Error('요청 시간이 초과되었습니다.'))).toBe(
      '요청 시간이 초과되었습니다.',
    );
  });

  it('문자열이 던져진 경우에도 그대로 사용한다', () => {
    expect(getErrorMessage('요청이 거부되었습니다.')).toBe('요청이 거부되었습니다.');
    expect(getErrorMessage('동기화가 중단되었습니다.')).toBe('동기화가 중단되었습니다.');
  });

  it('메시지가 비어 있는 Error 는 공통 기본 문구로 대체한다', () => {
    expect(getErrorMessage(new Error('   '))).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('Error 도 문자열도 아닌 값은 공통 기본 문구로 대체한다', () => {
    expect(getErrorMessage(undefined)).toBe(DEFAULT_ERROR_MESSAGE);
    expect(getErrorMessage({ code: 'C001' })).toBe(DEFAULT_ERROR_MESSAGE);
  });
});
