import type { ChecklistItem, Defect, ExecutionGateState, ExecutionItemGate, ReviewData } from '../../../types';

const REGRESSION_ITEM_ID = 'DUR-EXEC-03';
const SECURITY_ITEM_ID = 'DUR-EXEC-04';
const PERFORMANCE_ITEM_ID = 'DUR-EXEC-02';

type ExecutionGateInput = {
  checklist: ChecklistItem[];
  reviewData: Record<string, ReviewData>;
  defects: Defect[];
  finalized: boolean;
};

const isRegressionDone = (reviewData: Record<string, ReviewData>) => {
  const status = reviewData[REGRESSION_ITEM_ID]?.status ?? 'None';
  return status === 'Verified' || status === 'Cannot_Verify';
};

const hasDerivedFromRegression = (defects: Defect[]) =>
  defects.some((item) => item.isDerived && item.reportVersion >= 3);

const resolvePhase = (defects: Defect[], regressionDone: boolean): ExecutionGateState['phase'] => {
  const maxVersion = defects.reduce<number>((acc, item) => Math.max(acc, item.reportVersion), 0);
  if (maxVersion >= 4) return 'PATCH2_FINAL';
  if (maxVersion >= 3 || regressionDone) return 'PATCH1_REGRESSION';
  return 'INITIAL';
};

export const computeExecutionGate = ({
  checklist,
  reviewData,
  defects,
  finalized
}: ExecutionGateInput): {
  itemGates: Record<string, ExecutionItemGate>;
  executionState: ExecutionGateState;
} => {
  const regressionDone = isRegressionDone(reviewData);
  const derivedFoundInFeatureRegression = hasDerivedFromRegression(defects);
  const allowSecurityPerformance = regressionDone && !derivedFoundInFeatureRegression && !finalized;

  const executionState: ExecutionGateState = {
    phase: resolvePhase(defects, regressionDone),
    featureRegressionStatus: !regressionDone
      ? 'PENDING'
      : derivedFoundInFeatureRegression
        ? 'DERIVED_FOUND'
        : 'PASS',
    allowSecurityPerformance,
    derivedFoundInFeatureRegression,
    ...(finalized ? { finalizedAt: Date.now() } : {})
  };

  const itemGates: Record<string, ExecutionItemGate> = {};
  checklist.forEach((item) => {
    itemGates[item.id] = { state: 'enabled' };
  });

  if (finalized) {
    checklist
      .filter((item) => item.category === 'EXECUTION')
      .forEach((item) => {
        itemGates[item.id] = {
          state: 'blockedByFinalization',
          reason: '4차 확정 이후에는 수행 단계 상태를 변경할 수 없습니다.'
        };
      });
    return { itemGates, executionState };
  }

  if (!regressionDone) {
    itemGates[SECURITY_ITEM_ID] = {
      state: 'disabled',
      reason: '기능 회귀 테스트 결과가 확정되면 보안 테스트를 진행할 수 있습니다.'
    };
    itemGates[PERFORMANCE_ITEM_ID] = {
      state: 'disabled',
      reason: '기능 회귀 테스트 결과가 확정되면 성능 테스트를 진행할 수 있습니다.'
    };
    return { itemGates, executionState };
  }

  if (derivedFoundInFeatureRegression) {
    itemGates[SECURITY_ITEM_ID] = {
      state: 'disabled',
      reason: '기능 회귀에서 파생 결함이 발견되어 보안 테스트는 생략됩니다.'
    };
    itemGates[PERFORMANCE_ITEM_ID] = {
      state: 'disabled',
      reason: '기능 회귀에서 파생 결함이 발견되어 성능 테스트는 생략됩니다.'
    };
  }

  return { itemGates, executionState };
};

