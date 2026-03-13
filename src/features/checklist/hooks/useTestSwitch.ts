import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { QuickReviewAnswer, ReviewData } from '../../../types';

export function useTestSwitch(
  currentTestNumber: string,
  setReviewData: Dispatch<SetStateAction<Record<string, ReviewData>>>,
  setQuickReviewById: Dispatch<SetStateAction<Record<string, QuickReviewAnswer>>>,
  setSelectedReqId: Dispatch<SetStateAction<string | null>>,
  setFirestoreLoaded: Dispatch<SetStateAction<boolean>>,
) {
  const prevTestRef = useRef(currentTestNumber);

  useEffect(() => {
    if (prevTestRef.current === currentTestNumber) return;
    prevTestRef.current = currentTestNumber;
    if (!currentTestNumber) {
      setReviewData({});
      setQuickReviewById({});
      setSelectedReqId(null);
      return;
    }
    // 시험 전환 시 기존 데이터 클리어 후 Firestore 로드
    setReviewData({});
    setQuickReviewById({});
    setSelectedReqId(null);
    setFirestoreLoaded(false);
  }, [currentTestNumber, setReviewData, setQuickReviewById, setSelectedReqId, setFirestoreLoaded]);
}
