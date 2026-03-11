import type { Project } from '../types';

export const MILESTONES = [
  { key: 'scheduleStartDate', label: '시험 시작일', color: 'blue' },
  { key: 'scheduleDefect1', label: '1차 결함 리포트', color: 'amber' },
  { key: 'schedulePatchDate', label: '패치일', color: 'purple' },
  { key: 'scheduleEndDate', label: '시험 종료일', color: 'emerald' },
] as const;

export type MilestoneKey = (typeof MILESTONES)[number]['key'];
export type MilestoneColor = (typeof MILESTONES)[number]['color'] | 'cyan' | 'orange' | 'rose' | 'teal';

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

export const CUSTOM_COLORS: MilestoneColor[] = ['cyan', 'orange', 'rose', 'teal'];

export type MilestoneItem = {
  id: string;
  label: string;
  color: MilestoneColor;
  builtIn: boolean;
  date: string;
};

export function buildMilestoneList(project: Project): MilestoneItem[] {
  const builtInItems: MilestoneItem[] = MILESTONES.map((m) => ({
    id: m.key,
    label: m.label,
    color: m.color as MilestoneColor,
    builtIn: true,
    date: (project[m.key] as string) ?? '',
  }));

  const customItems: MilestoneItem[] = (project.customMilestones ?? []).map((cm) => ({
    id: cm.id,
    label: cm.label,
    color: cm.color as MilestoneColor,
    builtIn: false,
    date: cm.date,
  }));

  const allItems = [...builtInItems, ...customItems];

  if (project.milestoneOrder?.length) {
    const orderMap = new Map(project.milestoneOrder.map((id, idx) => [id, idx]));
    allItems.sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 999;
      const bi = orderMap.get(b.id) ?? 999;
      return ai - bi;
    });
  }

  return allItems;
}
