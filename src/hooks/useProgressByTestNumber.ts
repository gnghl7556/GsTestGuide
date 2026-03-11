import { useEffect, useState } from 'react';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Project } from '../types';

export function useProgressByTestNumber(
  db: Firestore | null | undefined,
  authReady: boolean,
  projects: Project[],
) {
  const [progressByTestNumber, setProgressByTestNumber] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!db || !authReady || projects.length === 0) return;
    const dbRef = db;
    let alive = true;
    const load = async () => {
      const entries = await Promise.all(
        projects.map(async (project) => {
          // 완료된 시험은 100%
          if (project.status === '완료') return [project.testNumber, 100] as const;
          try {
            const snap = await getDoc(doc(dbRef, 'quickReviews', project.testNumber));
            if (!snap.exists()) return [project.testNumber, 0] as const;
            const data = snap.data() as { items?: Record<string, Record<string, unknown>> };
            if (!data.items) return [project.testNumber, 0] as const;
            const items = Object.values(data.items);
            const total = items.length;
            if (total === 0) return [project.testNumber, 0] as const;
            const decided = items.filter((item) => item.finalDecision != null).length;
            const percent = Math.round((decided / total) * 100);
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
  }, [authReady, db, projects]);

  return progressByTestNumber;
}
