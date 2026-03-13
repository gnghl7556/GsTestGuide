import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { logger } from '../../../utils/logger';
import type {
  QuickAnswer,
  QuickDecision,
  QuickReviewAnswer,
  ReviewData
} from '../../../types';

type QuickInputValues = NonNullable<QuickReviewAnswer['inputValues']>;

export function useFirestoreReviewLoader(
  currentTestNumber: string,
  hasLocalData: boolean,
  setQuickReviewById: Dispatch<SetStateAction<Record<string, QuickReviewAnswer>>>,
  setReviewData: Dispatch<SetStateAction<Record<string, ReviewData>>>,
) {
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);
  const activeTestRef = useRef(currentTestNumber);

  useEffect(() => {
    if (!db || !currentTestNumber) return;
    activeTestRef.current = currentTestNumber;
    if (firestoreLoaded) return;
    if (hasLocalData) {
      setFirestoreLoaded(true);
      return;
    }

    let alive = true;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db!, 'quickReviews', currentTestNumber));
        if (!alive || currentTestNumber !== activeTestRef.current) return;
        setFirestoreLoaded(true);
        if (!snap.exists()) return;
        const data = snap.data() as { items?: Record<string, Record<string, unknown>> };
        if (!data.items || Object.keys(data.items).length === 0) return;

        setQuickReviewById((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const result: Record<string, QuickReviewAnswer> = {};
          for (const [itemId, item] of Object.entries(data.items!)) {
            result[itemId] = {
              requirementId: (item.requirementId as string) || itemId,
              answers: (item.answers as Record<string, QuickAnswer>) || {},
              inputValues: (item.inputValues as QuickInputValues) || {},
              answeredQuestions: (item.answeredQuestions as Record<string, boolean>) || {},
              autoRecommendation: (item.autoRecommendation as QuickDecision) || 'HOLD',
              finalDecision: (item.finalDecision as QuickDecision) || undefined,
              note: (item.note as string) || ''
            };
          }
          return result;
        });

        setReviewData((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const result: Record<string, ReviewData> = {};
          for (const [itemId, item] of Object.entries(data.items!)) {
            const status = item.reviewStatus as ReviewData['status'] | undefined;
            if (status && status !== 'None') {
              result[itemId] = {
                status,
                comment: (item.reviewComment as string) || '',
                docName: (item.reviewDocName as string) || '',
                page: (item.reviewPage as string) || ''
              };
            }
          }
          return result;
        });
      } catch (error) {
        if (alive) setFirestoreLoaded(true);
        logger.warn('Firestore', '점검 데이터 로드 실패', error);
      }
    };
    void load();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTestNumber, firestoreLoaded]);

  return { firestoreLoaded, setFirestoreLoaded };
}
