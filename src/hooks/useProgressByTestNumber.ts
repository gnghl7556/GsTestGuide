import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Project } from '../types';
import { isProjectFinalized } from '../utils/projectUtils';
import { logger } from '../utils/logger';

export function useProgressByTestNumber(
  db: Firestore | null | undefined,
  authReady: boolean,
  projects: Project[],
) {
  const [progressByTestNumber, setProgressByTestNumber] = useState<Record<string, number>>({});

  // Fix 9: testNumbers 문자열로 메모이제이션하여 projects 배열 참조 변경 시 불필요한 재실행 방지
  const testNumbersKey = useMemo(
    () => projects.map((p) => p.testNumber).sort().join(','),
    [projects]
  );

  useEffect(() => {
    if (!db || !authReady || projects.length === 0) return;
    const dbRef = db;
    let alive = true;
    const load = async () => {
      const entries = await Promise.all(
        projects.map(async (project) => {
          // Fix 10: isProjectFinalized 유틸로 통일
          if (isProjectFinalized(project)) return [project.testNumber, 100] as const;
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
            logger.warn('QuickReviews', '진행율 조회 실패', error);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, db, testNumbersKey]);

  return progressByTestNumber;
}
