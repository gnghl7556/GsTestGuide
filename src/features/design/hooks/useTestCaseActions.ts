import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

type FeatureItem = {
  id: string;
  description: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
};

export type TestCaseItem = {
  id: string;
  testCaseId: string;
  featureId: string;
  scenario: string;
  preCondition?: string;
  steps: string[];
  expectedResult: string;
  status: '대기' | 'Pass' | 'Fail' | 'Skip';
  version: number;
};

const generateDraftFromFeatures = (features: FeatureItem[]) => {
  return features.map((feature, index) => ({
    id: `draft-${Date.now()}-${index}`,
    testCaseId: `TC-${String(index + 1).padStart(3, '0')}-001`,
    featureId: feature.id,
    scenario: `${feature.description || '기능'} 검증`,
    preCondition: '',
    steps: ['준비 상태 확인', '기능 실행', '결과 확인'],
    expectedResult: `${feature.description || '기능'}이(가) 정상적으로 동작한다.`,
    status: '대기' as const,
    version: 1
  }));
};

export function useTestCaseActions() {
  const { currentTestNumber } = useTestSetupContext();
  const projectId = currentTestNumber;

  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db || !projectId) return;
    const dbRef = db;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const featureSnap = await getDocs(collection(dbRef, 'projects', projectId, 'features'));
        const nextFeatures = featureSnap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<FeatureItem, 'id'>;
          return {
            id: docSnap.id,
            description: data.description || '',
            category1: data.category1,
            category2: data.category2,
            category3: data.category3,
            category4: data.category4
          };
        });

        const tcSnap = await getDocs(collection(dbRef, 'projects', projectId, 'testCases'));
        const nextCases = tcSnap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<TestCaseItem, 'id'>;
          return {
            id: docSnap.id,
            testCaseId: data.testCaseId || docSnap.id,
            featureId: data.featureId || '',
            scenario: data.scenario || '',
            preCondition: data.preCondition || '',
            steps: Array.isArray(data.steps) ? data.steps : [],
            expectedResult: data.expectedResult || '',
            status: data.status || '대기',
            version: data.version || 1
          };
        });

        if (!alive) return;
        setFeatures(nextFeatures);
        if (nextCases.length > 0) {
          setTestCases(nextCases);
        } else {
          setTestCases(generateDraftFromFeatures(nextFeatures));
        }
      } catch (error) {
        console.warn('[TestCases] 불러오기 실패:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [projectId]);

  const addTestCase = useCallback(
    (input: Omit<TestCaseItem, 'id' | 'testCaseId'>) => {
      const nextIndex = testCases.length + 1;
      setTestCases((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          testCaseId: `TC-${String(nextIndex).padStart(3, '0')}-001`,
          featureId: input.featureId,
          scenario: input.scenario,
          preCondition: input.preCondition || '',
          steps: input.steps.length ? input.steps : [''],
          expectedResult: input.expectedResult,
          status: input.status,
          version: input.version
        }
      ]);
    },
    [testCases.length]
  );

  const updateTestCase = useCallback((next: TestCaseItem) => {
    setTestCases((prev) => prev.map((item) => (item.id === next.id ? { ...next } : item)));
  }, []);

  const deleteTestCase = useCallback((id: string) => {
    setTestCases((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const saveTestCases = useCallback(async () => {
    if (!db || !projectId) return;
    const dbRef = db;
    setSaving(true);
    try {
      const batch = writeBatch(dbRef);
      const tcCol = collection(dbRef, 'projects', projectId, 'testCases');
      const existing = await getDocs(tcCol);
      existing.forEach((docSnap) => batch.delete(docSnap.ref));
      testCases.forEach((tc, index) => {
        const id = tc.id.startsWith('local-') ? `TC-${String(index + 1).padStart(3, '0')}-001` : tc.id;
        batch.set(doc(tcCol, id), {
          testCaseId: tc.testCaseId || id,
          featureId: tc.featureId,
          scenario: tc.scenario,
          preCondition: tc.preCondition || '',
          steps: tc.steps || [],
          expectedResult: tc.expectedResult,
          status: tc.status,
          version: tc.version || 1
        });
      });
      await batch.commit();
    } catch (error) {
      console.warn('[TestCases] 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  }, [projectId, testCases]);

  const generateDraft = useCallback(() => {
    setTestCases(generateDraftFromFeatures(features));
  }, [features]);

  return useMemo(
    () => ({
      testCases,
      features,
      loading,
      saving,
      addTestCase,
      deleteTestCase,
      updateTestCase,
      saveTestCases,
      generateDraft
    }),
    [testCases, features, loading, saving, addTestCase, deleteTestCase, updateTestCase, saveTestCases, generateDraft]
  );
}
