package com.daypoo.api.util;

public class ChosungUtils {

  private static final char[] CHOSUNG = {
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  };

  /** 한글 문자열에서 초성만 추출 (공백 및 특수문자 제거 버전) */
  public static String extractChosung(String text) {
    if (text == null) return "";
    StringBuilder sb = new StringBuilder();
    for (char c : text.toCharArray()) {
      if (c >= 0xAC00 && c <= 0xD7A3) { // 한글 음절
        sb.append(CHOSUNG[(c - 0xAC00) / (21 * 28)]);
      } else if (c >= 0x3131 && c <= 0x314E) { // 이미 초성인 경우
        sb.append(c);
      }
      // 그 외 공백, 숫자, 영문, 특수기호는 검색 품질을 위해 제외
    }
    return sb.toString();
  }

  /** 문자열이 초성(한글 자음 자모)만으로 이루어졌는지 판별 공백은 허용, 영숫자 혼합이면 false */
  public static boolean isChosungOnly(String text) {
    if (text == null || text.isBlank()) return false;
    boolean hasChosung = false;
    for (char c : text.toCharArray()) {
      if (c == ' ') continue;
      // 한글 자음 자모 범위: ㄱ(0x3131) ~ ㅎ(0x314E)
      if (c >= 0x3131 && c <= 0x314E) {
        hasChosung = true;
      } else {
        return false;
      }
    }
    return hasChosung;
  }
}
