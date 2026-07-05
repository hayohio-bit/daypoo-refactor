package com.daypoo.api.dto;

public record EquippedItemResponse(String icon, String name, String type, String iconType) {

  /**
   * itemId를 받아 imageUrl이 null인 경우 dicebear seed로 폴백. 프론트엔드가 동일한 seed로 동일한 아바타를 렌더링할 수 있도록 일관성을
   * 보장한다.
   */
  public static EquippedItemResponse of(String imageUrl, String name, String type, Long itemId) {
    String resolvedIcon =
        (imageUrl != null) ? imageUrl : "dicebear:" + dicebearStyle(type) + ":item-" + itemId;
    return new EquippedItemResponse(resolvedIcon, name, type, detectIconType(resolvedIcon));
  }

  /**
   * 프론트엔드 generateItemAvatar()의 타입별 스타일 매핑과 동일하게 유지. AVATAR → avataaars, EFFECT → pixelArt, 기타 →
   * bottts
   */
  private static String dicebearStyle(String type) {
    if ("AVATAR".equals(type)) return "avataaars";
    if ("EFFECT".equals(type)) return "pixelArt";
    return "bottts";
  }

  private static String detectIconType(String imageUrl) {
    if (imageUrl == null) return null;
    if (imageUrl.startsWith("dicebear:")) return "DICEBEAR";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return "URL";
    return "EMOJI";
  }
}
