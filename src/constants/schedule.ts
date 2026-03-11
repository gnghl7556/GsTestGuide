import type { Project } from '../types';

export const MILESTONES = [
  { key: 'scheduleStartDate', label: '시험 시작일', icon: 'contract' },
  { key: 'scheduleDefect1', label: '1차 결함 리포트', icon: 'bug' },
  { key: 'schedulePatchDate', label: '패치일', icon: 'wrench' },
  { key: 'scheduleEndDate', label: '시험 종료일', icon: 'contract' },
] as const;

export const OPTIONAL_MILESTONES = [
  { id: 'opt-defect2', label: '2차 결함 리포트', icon: 'bug' },
  { id: 'opt-regression1', label: '1차 회귀 리포트', icon: 'refresh' },
  { id: 'opt-regression2', label: '2차 회귀 리포트', icon: 'refresh' },
  { id: 'opt-patch2', label: '2차 패치일', icon: 'wrench' },
];

/** milestone id/key → icon name */
export const MILESTONE_ICON_MAP: Record<string, string> = {
  scheduleStartDate: 'contract',
  scheduleDefect1: 'bug',
  schedulePatchDate: 'wrench',
  scheduleEndDate: 'contract',
  'opt-defect2': 'bug',
  'opt-regression1': 'refresh',
  'opt-regression2': 'refresh',
  'opt-patch2': 'wrench',
};

export type MilestoneKey = (typeof MILESTONES)[number]['key'];
export type MilestoneColor = 'blue' | 'amber' | 'purple' | 'emerald' | 'cyan' | 'orange' | 'rose' | 'teal';

export const PROJECT_COLORS: MilestoneColor[] = [
  'blue', 'amber', 'purple', 'emerald', 'cyan', 'orange', 'rose', 'teal',
];

export const MILESTONE_COLOR_MAP: Record<
  MilestoneColor,
  { dot: string; bg: string; text: string; border: string }
> = {
  blue: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-200',
    border: 'border-blue-300 dark:border-blue-500/40',
  },
  amber: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-500/40',
  },
  purple: {
    dot: 'bg-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-200',
    border: 'border-purple-300 dark:border-purple-500/40',
  },
  emerald: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-200',
    border: 'border-emerald-300 dark:border-emerald-500/40',
  },
  cyan: {
    dot: 'bg-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-200',
    border: 'border-cyan-300 dark:border-cyan-500/40',
  },
  orange: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-200',
    border: 'border-orange-300 dark:border-orange-500/40',
  },
  rose: {
    dot: 'bg-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-200',
    border: 'border-rose-300 dark:border-rose-500/40',
  },
  teal: {
    dot: 'bg-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-500/20',
    text: 'text-teal-700 dark:text-teal-200',
    border: 'border-teal-300 dark:border-teal-500/40',
  },
};

/** testNumber 기반 결정적 해시로 프로젝트 고유 색상 반환 */
export function getProjectColor(project: Project): MilestoneColor {
  if (project.projectColor && PROJECT_COLORS.includes(project.projectColor as MilestoneColor)) {
    return project.projectColor as MilestoneColor;
  }
  const str = project.testNumber || project.id;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

export type MilestoneItemType = 'required' | 'optional' | 'custom';

export type MilestoneItem = {
  id: string;
  label: string;
  type: MilestoneItemType;
  date: string;
};

export function buildInitialLists(project: Project): {
  registered: MilestoneItem[];
  pool: MilestoneItem[];
  projectColor: MilestoneColor;
} {
  const projectColor = getProjectColor(project);
  const savedCustom = project.customMilestones ?? [];
  const savedOrder = project.milestoneOrder ?? [];
  const registeredIdSet = new Set(savedOrder);

  const required: MilestoneItem[] = MILESTONES.map((m) => ({
    id: m.key,
    label: m.label,
    type: 'required' as const,
    date: (project[m.key] as string) ?? '',
  }));

  const optionalIds = new Set(OPTIONAL_MILESTONES.map((m) => m.id));
  const requiredKeys = new Set<string>(MILESTONES.map((m) => m.key));

  const optionalItems: MilestoneItem[] = OPTIONAL_MILESTONES.map((m) => {
    const saved = savedCustom.find((c) => c.id === m.id);
    return { id: m.id, label: m.label, type: 'optional' as const, date: saved?.date ?? '' };
  });

  const customItems: MilestoneItem[] = savedCustom
    .filter((c) => !optionalIds.has(c.id) && !requiredKeys.has(c.id))
    .map((c) => ({ id: c.id, label: c.label, type: 'custom' as const, date: c.date }));

  const registered = [...required];
  const pool: MilestoneItem[] = [];

  for (const item of [...optionalItems, ...customItems]) {
    if (registeredIdSet.has(item.id)) registered.push(item);
    else pool.push(item);
  }

  if (savedOrder.length) {
    const orderMap = new Map(savedOrder.map((id, idx) => [id, idx]));
    registered.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }

  return { registered, pool, projectColor };
}
