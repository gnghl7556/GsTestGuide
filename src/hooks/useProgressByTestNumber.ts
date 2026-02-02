import { useEffect, useState } from 'react';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { ChecklistItem, Project } from '../types';

export function useProgressByTestNumber(
  db: Firestore | null | undefined,
  authReady: boolean,
  projects: Project[],
  checklist: ChecklistItem[]
) {
  const [progressByTestNumber, setProgressByTestNumber] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!db || !authReady || projects.length === 0 || checklist.length === 0) return;
    const dbRef = db;
    let alive = true;
    const total = checklist.length;
    const load = async () => {
      const entries = await Promise.all(
        projects.map(async (project) => {
          try {
            const snap = await getDoc(doc(dbRef, 'quickReviews', project.testNumber));
            if (!snap.exists()) return [project.testNumber, 0] as const;
            const data = snap.data() as { items?: Record<string, unknown> };
            const count = data.items ? Object.keys(data.items).length : 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return [project.testNumber, percent] as const;
          } catch (error) {
            console.warn('[QuickReviews] 진행율 조회 실패:', error);
            return [project.testNumber, 0] as const;
          }
        })
      );
      if (!alive) return;
      setProgressByTestNumber(Object.fromEntries(entries));
    };
    void load();
    return () => {
      alive = false;
    };
  }, [authReady, checklist.length, db, projects]);

  return progressByTestNumber;
}
