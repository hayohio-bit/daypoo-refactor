import { createAvatar } from '@dicebear/core';
import { funEmoji, avataaars, bottts, lorelei, pixelArt } from '@dicebear/collection';

/**
 * 사용 가능한 아바타 스타일
 */
export type AvatarStyle = 'funEmoji' | 'avataaars' | 'bottts' | 'lorelei' | 'pixelArt';

/**
 * 전역 유틸리티: 이모지 판단 함수
 */
export const isEmoji = (str: string | null | undefined): boolean => {
  if (!str) return false;
  // 단일 이모지 또는 결합된 이모지 시퀀스를 판별하기 위한 정규식
  return str.length <= 8 && /\p{Extended_Pictographic}/u.test(str);
};

/**
 * 아바타 스타일별 설정
 */
const AVATAR_STYLES = {
  funEmoji: funEmoji,      // 이모지 조합 (귀여움, 가벼움)
  avataaars: avataaars,    // 픽사 스타일 (친근함)
  bottts: bottts,          // 로봇 (독특함)
  lorelei: lorelei,        // 만화 스타일 (세련됨)
  pixelArt: pixelArt,      // 픽셀 아트 (레트로)
};

/**
 * 사용자 ID 또는 닉네임 기반 고유 아바타 생성
 *
 * @param seed - 사용자 ID 또는 닉네임 (고유값)
 * @param style - 아바타 스타일 (기본: funEmoji)
 * @param size - 아바타 크기 (기본: 128)
 * @returns SVG 데이터 URI (data:image/svg+xml;base64,...)
 *
 * @example
 * ```tsx
 * const avatarUrl = generateAvatar(user.id);
 * <img src={avatarUrl} alt="avatar" />
 * ```
 */
/**
 * 사용자 ID 또는 닉네임 기반 고유 아바타 생성 (무작위 생성 복구)
 *
 * @param seed - 사용자 ID 또는 닉네임 (고유값)
 * @param style - 아바타 스타일 (기본: funEmoji)
 * @param size - 아바타 크기 (기본: 256)
 * @returns SVG 데이터 URI
 */
export const generateAvatar = (
  seed: string | number,
  style: AvatarStyle = 'funEmoji',
  size: number = 256
): string => {
  // 사용자별 고유한 아바타를 위해 seed를 사용합니다.
  const avatar = createAvatar(AVATAR_STYLES[style] as any, {
    seed: `daypoo-${seed}`,
    size,
  });
  return avatar.toDataUri();
};

/**
 * 디폴트 아바타 URL (시스템 공통 똥 캐릭터 SVG)
 */
export const DEFAULT_AVATAR_URL = '/assets/default-avatar.svg';

/**
 * React 컴포넌트에서 사용하기 쉬운 훅
 */
export const useAvatar = (
  seed: string | number,
  style: AvatarStyle = 'funEmoji',
  size: number = 128
): string => {
  return generateAvatar(seed, style, size);
};

export const generateRankingAvatar = (userId: string | number, rank: number, equippedAvatarUrl?: string | null): string => {
  if (equippedAvatarUrl) {
    return parseDicebearUrl(equippedAvatarUrl, userId, 'AVATAR', 128);
  }
  return generateAvatar(userId, 'funEmoji', 128);
};

/**
 * 프로필용 아바타 (큰 사이즈, 장착 아바타가 있으면 반영, 없으면 시스템 기본값)
 */
export const generateProfileAvatar = (userId: string | number, equippedAvatarUrl?: string | null): string => {
  if (equippedAvatarUrl) {
    return parseDicebearUrl(equippedAvatarUrl, userId, 'AVATAR', 256);
  }
  return generateAvatar(userId, 'funEmoji', 256);
};

/**
 * 채팅/댓글용 아바타 (작은 사이즈, 장착 아바타가 있으면 반영, 없으면 시스템 기본값)
 */
export const generateSmallAvatar = (userId: string | number, equippedAvatarUrl?: string | null): string => {
  if (equippedAvatarUrl) {
    return parseDicebearUrl(equippedAvatarUrl, userId, 'AVATAR', 48);
  }
  return DEFAULT_AVATAR_URL;
};

/**
 * 상점 아이템용 아바타 (아이템 타입별 다른 스타일)
 * - 아이템의 경우 각각 개성이 있어야 하므로 DiceBear 생성을 유지합니다.
 */
export const generateItemAvatar = (
  itemId: string | number,
  itemType: string = 'AVATAR'
): string => {
  const style: AvatarStyle = itemType === 'AVATAR' ? 'avataaars' :
                              itemType === 'EFFECT' ? 'pixelArt' :
                              'bottts';
  
  // 아이템은 여전히 DiceBear를 사용하여 고유하게 보이도록 합니다.
  const avatar = createAvatar(AVATAR_STYLES[style] as any, {
    seed: `item-${itemId}`,
    size: 200,
  });
  return avatar.toDataUri();
};

/**
 * imageUrl 값을 파싱하여 실제 표시할 이미지 또는 특수 아바타 이미지를 반환
 */
export const parseDicebearUrl = (
  imageUrl: string | null | undefined,
  fallbackId: string | number,
  fallbackType: string = 'AVATAR',
  size: number = 200
): string => {
  if (imageUrl && imageUrl.startsWith('dicebear:')) {
    const parts = imageUrl.split(':');
    if (parts.length >= 3) {
      const styleStr = parts[1] as AvatarStyle;
      const seed = parts.slice(2).join(':');
      const validStyle = AVATAR_STYLES[styleStr] ? styleStr : 'funEmoji';
      const avatar = createAvatar(AVATAR_STYLES[validStyle] as any, {
        seed: seed,
        size,
      });
      return avatar.toDataUri();
    }
  }
  
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl; // URL or Emoji
  }

  // 폴백이 'USER'인 경우만 디폴트 실루엣 반환 (유저 프로필 용도)
  // 'AVATAR' 타입의 상점 아이템인 경우는 아래의 generateItemAvatar를 타도록 함
  if (fallbackType === 'USER') {
    return DEFAULT_AVATAR_URL;
  }

  return generateItemAvatar(fallbackId, fallbackType);
};
