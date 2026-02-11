import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, X, RefreshCcw } from 'lucide-react';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { DefectReportModal } from '../../defects/components/DefectReportModal';

type FeatureItem = {
  id: string;
  description: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
};

type TestCaseItem = {
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

interface TestCaseModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

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

export function TestCaseModal({ open, projectId, onClose }: TestCaseModalProps) {
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [defectModalOpen, setDefectModalOpen] = useState(false);
  const [defectTarget, setDefectTarget] = useState<TestCaseItem | null>(null);

  const [newCase, setNewCase] = useState<Omit<TestCaseItem, 'id' | 'testCaseId'>>({
    featureId: '',
    scenario: '',
    preCondition: '',
    steps: [],
    expectedResult: '',
    status: '대기',
    version: 1
  });

  useEffect(() => {
    if (!open || !db || !projectId) return;
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
          const draft = generateDraftFromFeatures(nextFeatures);
          setTestCases(draft);
          setDraftMessage('기능 리스트 기반 TC 초안을 생성했습니다.');
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
  }, [open, projectId]);

  const featureOptions = useMemo(() => {
    return features.map((feature) => ({
      id: feature.id,
      label: [feature.category1, feature.category2, feature.category3, feature.category4]
        .filter(Boolean)
        .join(' > ') || feature.description || feature.id
    }));
  }, [features]);

  const addCase = () => {
    if (!newCase.featureId || !newCase.scenario.trim()) return;
    const nextIndex = testCases.length + 1;
    setTestCases((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        testCaseId: `TC-${String(nextIndex).padStart(3, '0')}-001`,
        featureId: newCase.featureId,
        scenario: newCase.scenario,
        preCondition: newCase.preCondition || '',
        steps: newCase.steps.length ? newCase.steps : [''],
        expectedResult: newCase.expectedResult,
        status: newCase.status,
        version: newCase.version
      }
    ]);
    setNewCase({
      featureId: '',
      scenario: '',
      preCondition: '',
      steps: [],
      expectedResult: '',
      status: '대기',
      version: 1
    });
  };

  const handleSave = async () => {
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
      onClose();
    } catch (error) {
      console.warn('[TestCases] 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-6xl rounded-2xl border border-ln bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-tx-primary">TC 관리</h2>
            <p className="text-xs text-tx-tertiary mt-1">기능 리스트 기반 TC 초안 생성 및 편집</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-ln px-3 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            <X size={14} />
            닫기
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2.1fr_1fr] gap-6 p-6">
          <div className="space-y-4">
            <div className="rounded-xl border border-ln bg-surface-raised p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-tx-primary">TC 초안 생성</div>
                  <div className="text-xs text-tx-tertiary">features 컬렉션 기반으로 초안을 생성합니다.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const draft = generateDraftFromFeatures(features);
                    setTestCases(draft);
                    setDraftMessage('기능 리스트 기반 TC 초안을 다시 생성했습니다.');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-ln bg-surface-base px-3 py-2 text-xs font-semibold text-tx-secondary hover:border-ln-strong"
                >
                  <RefreshCcw size={14} />
                  초안 재생성
                </button>
              </div>
              {draftMessage && <div className="mt-2 text-xs text-tx-tertiary">{draftMessage}</div>}
            </div>

            <div className="rounded-xl border border-ln bg-surface-base p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-tx-primary">TC 목록</div>
                <div className="text-xs text-tx-muted">{testCases.length}개</div>
              </div>
              {loading ? (
                <div className="py-12 text-center text-sm text-tx-muted">불러오는 중...</div>
              ) : (
                <div className="mt-3 space-y-3 max-h-[52vh] overflow-y-auto pr-2">
                  {testCases.map((tc, idx) => (
                    <div key={tc.id} className="rounded-lg border border-ln bg-surface-raised p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-tx-secondary">{tc.testCaseId || `TC-${idx + 1}`}</div>
                        <button
                          type="button"
                          onClick={() => setTestCases((prev) => prev.filter((item) => item.id !== tc.id))}
                          className="text-[11px] text-danger-text"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <select
                          className="rounded-md border border-ln px-2 py-1"
                          value={tc.featureId}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((item) => (item.id === tc.id ? { ...item, featureId: e.target.value } : item))
                            )
                          }
                        >
                          <option value="">기능 선택</option>
                          {featureOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="rounded-md border border-ln px-2 py-1"
                          value={tc.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as TestCaseItem['status'];
                            setTestCases((prev) =>
                              prev.map((item) => (item.id === tc.id ? { ...item, status: nextStatus } : item))
                            );
                            if (nextStatus === 'Fail') {
                              setDefectTarget(tc);
                              setDefectModalOpen(true);
                            }
                          }}
                        >
                          {['대기', 'Pass', 'Fail', 'Skip'].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <input
                          className="rounded-md border border-ln px-2 py-1 md:col-span-2"
                          value={tc.scenario}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((item) => (item.id === tc.id ? { ...item, scenario: e.target.value } : item))
                            )
                          }
                          placeholder="테스트 시나리오"
                        />
                        <input
                          className="rounded-md border border-ln px-2 py-1 md:col-span-2"
                          value={tc.preCondition || ''}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((item) =>
                                item.id === tc.id ? { ...item, preCondition: e.target.value } : item
                              )
                            )
                          }
                          placeholder="사전 조건"
                        />
                        <textarea
                          className="rounded-md border border-ln px-2 py-1 md:col-span-2"
                          value={tc.steps.join('\n')}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((item) =>
                                item.id === tc.id ? { ...item, steps: e.target.value.split('\n') } : item
                              )
                            )
                          }
                          rows={3}
                          placeholder="실행 단계 (줄바꿈 구분)"
                        />
                        <textarea
                          className="rounded-md border border-ln px-2 py-1 md:col-span-2"
                          value={tc.expectedResult}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((item) =>
                                item.id === tc.id ? { ...item, expectedResult: e.target.value } : item
                              )
                            )
                          }
                          rows={2}
                          placeholder="기대 결과"
                        />
                      </div>
                    </div>
                  ))}
                  {testCases.length === 0 && (
                    <div className="py-8 text-center text-xs text-tx-muted">등록된 TC가 없습니다.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-ln bg-surface-base p-4">
              <div className="text-sm font-semibold text-tx-primary mb-3">새 TC 추가</div>
              <div className="space-y-2 text-xs">
                <select
                  className="w-full rounded-md border border-ln px-2 py-1"
                  value={newCase.featureId}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, featureId: e.target.value }))}
                >
                  <option value="">기능 선택</option>
                  {featureOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-md border border-ln px-2 py-1"
                  placeholder="테스트 시나리오"
                  value={newCase.scenario}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, scenario: e.target.value }))}
                />
                <input
                  className="w-full rounded-md border border-ln px-2 py-1"
                  placeholder="사전 조건"
                  value={newCase.preCondition || ''}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, preCondition: e.target.value }))}
                />
                <textarea
                  className="w-full rounded-md border border-ln px-2 py-1"
                  rows={3}
                  placeholder="실행 단계 (줄바꿈 구분)"
                  value={newCase.steps.join('\n')}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, steps: e.target.value.split('\n') }))}
                />
                <textarea
                  className="w-full rounded-md border border-ln px-2 py-1"
                  rows={2}
                  placeholder="기대 결과"
                  value={newCase.expectedResult}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, expectedResult: e.target.value }))}
                />
                <select
                  className="w-full rounded-md border border-ln px-2 py-1"
                  value={newCase.status}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, status: e.target.value as TestCaseItem['status'] }))}
                >
                  {['대기', 'Pass', 'Fail', 'Skip'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addCase}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-ln bg-surface-raised px-3 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover"
                >
                  <Plus size={14} />
                  TC 추가
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-ln bg-surface-base p-4">
              <div className="text-sm font-semibold text-tx-primary mb-2">저장</div>
              <p className="text-xs text-tx-tertiary mb-3">변경사항을 testCases 서브 컬렉션에 저장합니다.</p>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-ln px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:text-tx-primary"
          >
            <X size={14} />
            닫기
          </button>
        </div>
      </div>
      {defectTarget && (
        <DefectReportModal
          open={defectModalOpen}
          projectId={projectId}
          testCaseId={defectTarget.testCaseId || defectTarget.id}
          onClose={() => {
            setDefectModalOpen(false);
            setDefectTarget(null);
          }}
        />
      )}
    </div>
  );
}
