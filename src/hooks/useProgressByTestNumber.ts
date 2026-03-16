import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { REQUIREMENTS_DB } from 'virtual:content/process';
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

  // 전체 체크포인트 수 (점검항목별 checkPoints 합산, 마크다운 추가 시 자동 반영)
  const totalCheckpoints = useMemo(
    () => REQUIREMENTS_DB.reduce((sum, req) => sum + (req.checkPoints?.length ?? 0), 0),
    [],
  );

  useEffect(() => {
    if (!db || !authReady || projects.length === 0) return;
    const dbRef = db;
    let alive = true;
    const load = async () => {
      const entries = await Promise.all(
        projects.map(async (project) => {
          if (isProjectFinalized(project)) return [project.testNumber, 100] as const;
          try {
            const snap = await getDoc(doc(dbRef, 'quickReviews', project.testNumber));
            if (!snap.exists()) return [project.testNumber, 0] as const;
            const data = snap.data() as { items?: Record<string, Record<string, unknown>> };
            if (!data.items) return [project.testNumber, 0] as const;
            // 체크포인트(개별 질문) 단위로 응답 수 합산
            let answered = 0;
            for (const item of Object.values(data.items)) {
              const aq = item.answeredQuestions as Record<string, boolean> | undefined;
              if (aq) {
                answered += Object.values(aq).filter(Boolean).length;
              }
            }
            const percent = totalCheckpoints === 0 ? 0 : Math.round((answered / totalCheckpoints) * 100);
            return [project.testNumber, Math.min(percent, 100)] as const;
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
