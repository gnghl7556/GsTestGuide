declare module 'virtual:content/process' {
  import type { Requirement } from './checklist';
  export const REQUIREMENTS_DB: Requirement[];
}

declare module 'virtual:content/defects' {
  import type { DefectReference } from '../features/defects/data/defectReferences';
  export const DEFECT_REFERENCES: Record<string, DefectReference[]>;
}

declare module 'virtual:content/categories' {
  export const CATEGORIES: Array<{ id: string; name: string }>;
  export const CATEGORY_THEMES: Record<string, {
    bg: string;
    lightBg: string;
    text: string;
    border: string;
    activeBorder: string;
    ring: string;
    badgeBg: string;
    badgeText: string;
    idleBg: string;
    idleBorder: string;
    idleText: string;
    idleHoverBg: string;
    idleHoverBorder: string;
  }>;
}

declare module 'virtual:content/rules' {
  export const EXECUTION_GATE_CONFIG: {
    regressionItemId: string;
    securityItemId: string;
    performanceItemId: string;
  };
}

declare module 'virtual:content/references' {
  export interface ReferenceGuide {
    id: string;
    title: string;
    description: string;
    checkPoints: string[];
    tip: string;
  }
  export const REFERENCES: ReferenceGuide[];
}
