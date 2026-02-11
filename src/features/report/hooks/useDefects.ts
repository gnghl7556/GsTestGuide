import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, type DocumentData } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Defect } from '../../../types';

const normalizeDefect = (id: string, data: DocumentData): Defect => {
  return {
    defectId: data.defectId || id,
    defectNumber: data.defectNumber,
    linkedTestCaseId: data.linkedTestCaseId,
    reportVersion: (data.reportVersion ?? 1) as Defect['reportVersion'],
    isDerived: Boolean(data.isDerived),
    summary: data.summary || '',
    testEnvironment: data.testEnvironment || '',
    severity: data.severity || 'M',
    frequency: data.frequency || 'I',
    qualityCharacteristic: data.qualityCharacteristic || '',
    accessPath: data.accessPath || '',
    stepsToReproduce: Array.isArray(data.stepsToReproduce) ? data.stepsToReproduce : [],
    description: data.description || '',
    ttaComment: data.ttaComment || '',
    status: data.status || '신규',
    reportedBy: data.reportedBy || '',
    reportedAt: data.reportedAt
  };
};

export type DefectFilter = {
  version: 'ALL' | 1 | 2 | 3 | 4;
  derived: 'ALL' | 'DERIVED' | 'BASE';
  quality: string;
};

export const useDefects = (projectId: string | null) => {
  const [defects, setDefects] = useState<Defect[]>([]);

  useEffect(() => {
    if (!db || !projectId) {
      return;
    }
    const q = query(collection(db, 'projects', projectId, 'defects'), orderBy('reportedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((docSnap) => normalizeDefect(docSnap.id, docSnap.data()));
        setDefects(next);
      },
      () => {
        setDefects([]);
      }
    );
    return () => unsub();
  }, [projectId]);

  const byId = useMemo(() => {
    return defects.reduce<Record<string, Defect>>((acc, item) => {
      acc[item.defectId] = item;
      return acc;
    }, {});
  }, [defects]);

  const loading = Boolean(projectId) && defects.length === 0;

  return {
    defects: projectId ? defects : [],
    byId: projectId ? byId : {},
    loading: projectId ? loading : false
  };
};
