import { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { TestSetupProvider } from './providers/TestSetupProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { ExecutionToolbarProvider } from './providers/ExecutionToolbarContext';
import { auth, db, storage } from './lib/firebase';
import { useAuthReady } from './hooks/useAuthReady';
import { usePlDirectory } from './features/pl-directory/hooks/usePlDirectory';
import { useUsers } from './hooks/useUsers';
import { useProjects } from './features/project-management/hooks/useProjects';
import { useProgressByTestNumber } from './hooks/useProgressByTestNumber';
import type { ChecklistItem, TestSetupState } from './types';

function readStoredSetup(): { testSetup?: TestSetupState; currentUserId?: string } {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  if (window.sessionStorage?.getItem('gs-test-guide:skip-restore') === '1') return {};
  const raw = window.localStorage.getItem('gs-test-guide:review');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as { testSetup?: TestSetupState; currentUserId?: string };
    if (parsed.testSetup?.testNumber) {
      return { testSetup: parsed.testSetup, currentUserId: parsed.currentUserId };
    }
    return {};
  } catch {
    return {};
  }
}

export default function App() {
  const stored = useMemo(() => readStoredSetup(), []);
  const authReady = useAuthReady(auth);
  const plDirectory = usePlDirectory(db, authReady);
  const users = useUsers(db, authReady);
  const projects = useProjects(db, authReady);
  const progressByTestNumber = useProgressByTestNumber(db, authReady, projects, [] as ChecklistItem[]);

  return (
    <ThemeProvider>
      <TestSetupProvider
        db={db}
        storage={storage}
        authReady={authReady}
        projects={projects}
        plDirectory={plDirectory}
        users={users}
        progressByTestNumber={progressByTestNumber}
        initialTestSetup={stored.testSetup}
        initialCurrentUserId={stored.currentUserId}
      >
        <ExecutionToolbarProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ExecutionToolbarProvider>
      </TestSetupProvider>
    </ThemeProvider>
  );
}
