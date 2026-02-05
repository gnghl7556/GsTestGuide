import type { RequirementCategory } from '../types';

// 1. 카테고리 정의
export const CATEGORIES: { id: RequirementCategory; name: string }[] = [
  { id: 'SETUP', name: '시험 식별' },
  { id: 'DESIGN', name: '시험 설계' },
  { id: 'EXECUTION', name: '시험 수행' },
  { id: 'COMPLETION', name: '결과 산출' }
];

// 2. 카테고리 테마
// 반드시 export const CATEGORY_THEMES 로 시작해야 합니다.
export const CATEGORY_THEMES: Record<RequirementCategory, {
  bg: string; border: string; text: string; lightBg: string; activeBorder: string; ring: string; badgeBg: string; badgeText: string;
}> = {
  SETUP: {
    bg: 'bg-emerald-50',
    lightBg: 'bg-emerald-50/50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-500',
    ring: 'ring-emerald-100',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700'
  },
  DESIGN: {
    bg: 'bg-indigo-50',
    lightBg: 'bg-indigo-50/50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    activeBorder: 'border-indigo-500',
    ring: 'ring-indigo-100',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700'
  },
  EXECUTION: {
    bg: 'bg-sky-50',
    lightBg: 'bg-sky-50/50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    activeBorder: 'border-sky-500',
    ring: 'ring-sky-100',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700'
  },
  COMPLETION: {
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
