import { useEffect } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { ExecutionGateState, Project } from '../../../types';

export function useExecutionStateSync(
  currentTestNumber: string,
  executionState: ExecutionGateState,
  currentProject: Project | undefined,
) {
  useEffect(() => {
    if (!db || !currentTestNumber) return;
    const existingFinalizedAt = currentProject?.executionState?.finalizedAt;
    void setDoc(
      doc(db, 'projects', currentTestNumber),
      { executionState: { ...executionState, ...(existingFinalizedAt ? { finalizedAt: existingFinalizedAt } : {}), updatedAt: serverTimestamp() } },
      { merge: true }
    );
  }, [currentTestNumber, executionState]); // eslint-disable-line react-hooks/exhaustive-deps
}
