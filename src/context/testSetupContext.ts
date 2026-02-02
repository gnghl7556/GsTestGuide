import { createContext } from 'react';
import type { PlContact } from '../components/PlDirectoryPage';
import type { ProjectSummary } from '../hooks/useProjects';
import type { UserSummary } from '../hooks/useUsers';
import type { UseDirectoryActionsReturn } from '../hooks/useDirectoryActions';
import type { UseTestSetupStateReturn } from '../hooks/useTestSetupState';

export type TestSetupContextValue = UseTestSetupStateReturn &
  UseDirectoryActionsReturn & {
    projects: ProjectSummary[];
    plDirectory: PlContact[];
    users: UserSummary[];
    progressByTestNumber: Record<string, number>;
    authReady: boolean;
    dbReady: boolean;
  };

export const TestSetupContext = createContext<TestSetupContextValue | null>(null);
