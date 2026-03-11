import type { Project } from '../types';

/** 프로젝트 완료 여부 단일 판단 기준 */
export const isProjectFinalized = (project: Project | undefined): boolean =>
  Boolean(project?.executionState?.finalizedAt) || project?.status === '완료';
