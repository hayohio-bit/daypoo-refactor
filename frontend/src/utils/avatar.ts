import { avataaars, bottts, funEmoji, lorelei, pixelArt } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

/**
 * 사용 가능한 아바타 스타일
 */
export type AvatarStyle = 'funEmoji' | 'avataaars' | 'bottts' | 'lorelei' | 'pixelArt';

/**
 * 아바타 스타일별 설정
 */
const AVATAR_STYLES = {
  funEmoji: funEmoji, // 이모지 조합 (귀여움, 가벼움)
  avataaars: avataaars, // 픽사 스타일 (친근함)
  bottts: bottts, // 로봇 (독특함)
  lorelei: lorelei, // 만화 스타일 (세련됨)
  pixelArt: pixelArt, // 픽셀 아트 (레트로)
};

/**
 * 사용자 ID 또는 닉네임 기반 고유 아바타 생성
 *
 * @param seed - 사용자 ID 또는 닉네임 (고유값)
 * @param style - 아바타 스타일 (기본: funEmoji)
 * @param size - 아바타 크기 (기본: 256)
 * @returns SVG 데이터 URI (data:image/svg+xml;base64,...)
 */
export const generateAvatar = (
  seed: string | number,
  style: AvatarStyle = 'funEmoji',
  size = 256,
): string => {
  // 사용자별 고유한 아바타를 위해 seed를 사용합니다.
  const avatar = createAvatar(AVATAR_STYLES[style] as any, {
    seed: `daypoo-${seed}`,
    size,
  });
  return avatar.toDataUri();
};

/**
 * 프로필용 아바타 (큰 사이즈)
 */
export const generateProfileAvatar = (userId: string | number): string => {
  return generateAvatar(userId, 'funEmoji', 256);
};
