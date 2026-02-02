import { createContext } from 'react';
import type { PlContact } from '../components/PlDirectoryPage';
import type { Project, User } from '../types';
import type { UseDirectoryActionsReturn } from '../hooks/useDirectoryActions';
import type { UseTestSetupStateReturn } from '../hooks/useTestSetupState';

export type TestSetupContextValue = UseTestSetupStateReturn &
  UseDirectoryActionsReturn & {
    projects: Project[];
    plDirectory: PlContact[];
    users: User[];
    progressByTestNumber: Record<string, number>;
    authReady: boolean;
    dbReady: boolean;
  };

export const TestSetupContext = createContext<TestSetupContextValue | null>(null);
