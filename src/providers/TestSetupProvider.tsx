import type { ReactNode } from 'react';
import type { FirebaseStorage } from 'firebase/storage';
import type { Firestore } from 'firebase/firestore';
import type { PlContact } from '../features/pl-directory/components/PlDirectoryPage';
import { useDirectoryActions } from '../hooks/useDirectoryActions';
import { useTestSetupState, type UseTestSetupParams } from '../features/test-setup/hooks/useTestSetupState';
import type { Project, User } from '../types';
import { TestSetupContext } from './testSetupContext';

export type TestSetupProviderProps = {
  db: Firestore | null | undefined;
  storage: FirebaseStorage | null | undefined;
  authReady: boolean;
  projects: Project[];
  plDirectory: PlContact[];
  users: User[];
  progressByTestNumber: Record<string, number>;
  initialTestSetup?: UseTestSetupParams['initialTestSetup'];
  initialCurrentUserId?: string;
  children: ReactNode;
};

export function TestSetupProvider({
  db,
  storage,
  authReady,
  projects,
  plDirectory,
  users,
  progressByTestNumber,
  initialTestSetup,
  initialCurrentUserId,
  children
}: TestSetupProviderProps) {
  const testSetupState = useTestSetupState({
    db,
    storage,
    authReady,
    projects,
    plDirectory,
    users,
    initialTestSetup,
    initialCurrentUserId
  });
  const directoryActions = useDirectoryActions(db, authReady);
  const deleteUser = async (id: string) => {
    const ok = await directoryActions.deleteUser(id);
    if (ok && testSetupState.currentUserId === id) {
      testSetupState.setCurrentUserId('');
    }
    return ok;
  };

  return (
    <TestSetupContext.Provider
      value={{
        ...testSetupState,
        ...directoryActions,
        deleteUser,
        projects,
        plDirectory,
        users,
        progressByTestNumber,
        authReady,
        dbReady: Boolean(db) && authReady
      }}
    >
      {children}
    </TestSetupContext.Provider>
  );
}
