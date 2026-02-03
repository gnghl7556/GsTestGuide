import type { ReactNode } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { useAuthReady } from '../hooks/useAuthReady';
import { usePlDirectory } from '../features/pl-directory/hooks/usePlDirectory';
import { useUsers } from '../hooks/useUsers';
import { useProjects } from '../features/project-management/hooks/useProjects';
import { useProgressByTestNumber } from '../hooks/useProgressByTestNumber';
import { TestSetupProvider } from './TestSetupProvider';
import type { ChecklistItem } from '../types';

export type AppProvidersProps = {
  children: ReactNode;
  checklist?: ChecklistItem[];
};

export function AppProviders({ children, checklist = [] }: AppProvidersProps) {
  const authReady = useAuthReady(auth);
  const plDirectory = usePlDirectory(db, authReady);
  const users = useUsers(db, authReady);
  const projects = useProjects(db, authReady);
  const progressByTestNumber = useProgressByTestNumber(db, authReady, projects, checklist);

  return (
    <TestSetupProvider
      db={db}
      storage={storage}
      authReady={authReady}
      projects={projects}
      plDirectory={plDirectory}
      users={users}
      progressByTestNumber={progressByTestNumber}
    >
      {children}
    </TestSetupProvider>
  );
}
