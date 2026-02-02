import type { RequirementCategory } from '../types';

// 1. 카테고리 정의
export const CATEGORIES: { id: RequirementCategory; name: string }[] = [
  { id: 'BEFORE', name: '사전' },
  { id: 'DURING', name: '진행' },
  { id: 'AFTER', name: '사후' }
];

// 2. 카테고리 테마
// 반드시 export const CATEGORY_THEMES 로 시작해야 합니다.
export const CATEGORY_THEMES: Record<RequirementCategory, {
  bg: string; border: string; text: string; lightBg: string; activeBorder: string; ring: string; badgeBg: string; badgeText: string;
}> = {
  BEFORE: {
    bg: 'bg-teal-50',
    lightBg: 'bg-teal-50/50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    activeBorder: 'border-teal-500',
    ring: 'ring-teal-100',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700'
  },
  DURING: {
    bg: 'bg-sky-50',
    lightBg: 'bg-sky-50/50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    activeBorder: 'border-sky-500',
    ring: 'ring-sky-100',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700'
  },
  AFTER: {
    bg: 'bg-slate-50',
    lightBg: 'bg-slate-50/50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    activeBorder: 'border-slate-500',
    ring: 'ring-slate-100',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700'
  }
};
