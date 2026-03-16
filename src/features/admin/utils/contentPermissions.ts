import type { User } from '../../../types';

export type ContentEditPermission = 'structural' | 'text' | 'none';

/**
 * 사용자 역할에 따른 콘텐츠 편집 권한.
 * - Admin: structural (체크포인트 추가/삭제/순서 변경 포함 전체)
 * - Tester/PL: text (텍스트 수정만)
 * - 기타: none
 */
export function getContentEditPermission(user?: User | null): ContentEditPermission {
  if (!user) return 'none';
  if (user.role === 'Admin') return 'structural';
  if (user.role === 'Tester' || user.role === 'PL') return 'text';
  return 'none';
}
