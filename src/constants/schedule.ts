export const MILESTONES = [
  { key: 'scheduleStartDate', label: '시험 시작일', color: 'blue' },
  { key: 'scheduleDefect1', label: '1차 결함 리포트', color: 'amber' },
  { key: 'schedulePatchDate', label: '패치일', color: 'purple' },
  { key: 'scheduleEndDate', label: '시험 종료일', color: 'emerald' },
] as const;

export type MilestoneKey = (typeof MILESTONES)[number]['key'];
export type MilestoneColor = (typeof MILESTONES)[number]['color'];

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
};
