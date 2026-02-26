import { useEffect, useRef, useState, useCallback } from 'react';
import type { QuickAnswer, ReviewData } from '../../../types';

interface UseKeyboardShortcutsParams {
  isAllQuestionsAnswered: boolean;
  hasVerdict: boolean;
  isFinalized: boolean;
  answerCurrentQuestion: (value: QuickAnswer) => void;
  setVerdict: (status: ReviewData['status']) => void;
  undoLastAction: () => void;
  selectNextItem: () => void;
  selectPrevItem: () => void;
  confirmAndMoveNext: () => void;
  openDefectModal: () => void;
}

export function useKeyboardShortcuts(params: UseKeyboardShortcutsParams) {
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // ref로 최신 콜백/상태를 항상 참조 → 핸들러를 한 번만 등록
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const helpRef = useRef(showShortcutHelp);
  helpRef.current = showShortcutHelp;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 한글 IME 조합 중에는 무시
      if (e.isComposing) return;

      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // contentEditable 요소도 무시
      if ((e.target as HTMLElement).isContentEditable) return;

      const {
        isAllQuestionsAnswered, hasVerdict, isFinalized,
        answerCurrentQuestion, setVerdict: _setVerdict, undoLastAction,
        selectNextItem, selectPrevItem,
        confirmAndMoveNext, openDefectModal
      } = paramsRef.current;

      // 도움말이 열려 있으면 아무 키로 닫기
      if (helpRef.current && e.key !== '?') {
        e.preventDefault();
        setShowShortcutHelp(false);
        return;
      }

      if (e.key === '?') {
        setShowShortcutHelp((prev) => !prev);
        return;
      }

      if (isFinalized) return;

      switch (e.key) {
        // 체크포인트 답변 (방향키)
        case 'ArrowRight':
          e.preventDefault();
          if (!isAllQuestionsAnswered) answerCurrentQuestion('YES');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!isAllQuestionsAnswered) answerCurrentQuestion('NO');
          break;
        case ' ':
          e.preventDefault();
          if (!isAllQuestionsAnswered) answerCurrentQuestion('NA');
          break;
        // 체크포인트 간 이동 (같은 항목 내)
        case 'ArrowDown':
          e.preventDefault();
          if (!isAllQuestionsAnswered) selectNextItem();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isAllQuestionsAnswered) selectPrevItem();
          break;
        // 판정 확정 후 다음 이동
        case 'Enter':
          e.preventDefault();
          if (isAllQuestionsAnswered && hasVerdict) confirmAndMoveNext();
          break;
        case 'Escape':
          e.preventDefault();
          undoLastAction();
          break;
        case 'd':
          if (e.ctrlKey) {
            e.preventDefault();
            openDefectModal();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // 핸들러 1회 등록, ref로 최신 값 참조

  return { showShortcutHelp, dismissHelp: useCallback(() => setShowShortcutHelp(false), []) };
}
