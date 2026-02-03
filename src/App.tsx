import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { TestSetupProvider } from './providers/TestSetupProvider';
import { auth, db, storage } from './lib/firebase';
import { useAuthReady } from './hooks/useAuthReady';
import { usePlDirectory } from './features/pl-directory/hooks/usePlDirectory';
import { useUsers } from './hooks/useUsers';
import { useProjects } from './features/project-management/hooks/useProjects';
import { useProgressByTestNumber } from './hooks/useProgressByTestNumber';
import type { ChecklistItem } from './types';

export default function App() {
  const authReady = useAuthReady(auth);
  const plDirectory = usePlDirectory(db, authReady);
  const users = useUsers(db, authReady);
  const projects = useProjects(db, authReady);
  const progressByTestNumber = useProgressByTestNumber(db, authReady, projects, [] as ChecklistItem[]);

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
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TestSetupProvider>
  );
}
