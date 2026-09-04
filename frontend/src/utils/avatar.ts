import { funEmoji } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

/**
 * 사용자 ID 또는 닉네임 기반 고유 아바타 생성
 *
 * @param seed - 사용자 ID 또는 닉네임 (고유값)
 * @returns SVG 데이터 URI (data:image/svg+xml;base64,...)
 */
export const generateAvatar = (seed: string | number): string => {
  // 사용자별 고유한 아바타를 위해 seed를 사용합니다.
  const avatar = createAvatar(funEmoji, {
    seed: `daypoo-${seed}`,
    size: 256,
  });
  return avatar.toDataUri();
};
