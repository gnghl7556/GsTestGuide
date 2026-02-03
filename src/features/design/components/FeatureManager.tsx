import { useEffect, useMemo, useState } from 'react';
import { UploadCloud, Plus, Save, Pencil, Trash2 } from 'lucide-react';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../../../lib/firebase';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';
import { Button, Input } from '../../../components/ui';

type FeatureItem = {
  id: string;
  category1: string;
  category2: string;
  category3: string;
  category4?: string;
  description: string;
  version?: number;
  changeType?: string;
};

type DraftResponse = {
  features: Array<{
    category1?: string;
    category2?: string;
    category3?: string;
    category4?: string;
    description?: string;
  }>;
  message?: string;
};

const groupFeatures = (features: FeatureItem[]) => {
  const group: Record<string, Record<string, Record<string, Record<string, FeatureItem[]>>>> = {};
  features.forEach((feature) => {
    const c1 = feature.category1 || '미분류';
    const c2 = feature.category2 || '미분류';
    const c3 = feature.category3 || '미분류';
    const c4 = feature.category4 || '';
    group[c1] = group[c1] || {};
    group[c1][c2] = group[c1][c2] || {};
    group[c1][c2][c3] = group[c1][c2][c3] || {};
    group[c1][c2][c3][c4] = group[c1][c2][c3][c4] || [];
    group[c1][c2][c3][c4].push(feature);
  });
  return group;
};

export function FeatureManager() {
  const { currentTestNumber } = useTestSetupContext();
  const projectId = currentTestNumber;

  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'uploading' | 'generating' | 'done' | 'error'>('idle');
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState<Omit<FeatureItem, 'id'>>({
    category1: '',
    category2: '',
    category3: '',
    category4: '',
    description: '',
    version: 1,
    changeType: ''
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FeatureItem | null>(null);

  useEffect(() => {
    if (!db || !projectId) return;
    const dbRef = db;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(dbRef, 'projects', projectId, 'features'));
        const next = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<FeatureItem, 'id'>;
          return {
            id: docSnap.id,
            category1: data.category1 || '',
            category2: data.category2 || '',
            category3: data.category3 || '',
            category4: data.category4 || '',
            description: data.description || '',
            version: data.version,
            changeType: data.changeType
          };
        });
        if (alive) setFeatures(next);
      } catch (error) {
        console.warn('[Features] 불러오기 실패:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [projectId]);

  const grouped = useMemo(() => groupFeatures(features), [features]);

  const handleAddFeature = () => {
    if (!newFeature.category1.trim() || !newFeature.category2.trim() || !newFeature.category3.trim()) return;
    if (!newFeature.description.trim()) return;
    setFeatures((prev) => [
      ...prev,
      {
        ...newFeature,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category4: newFeature.category4?.trim() || ''
      }
    ]);
    setNewFeature({
      category1: '',
      category2: '',
      category3: '',
      category4: '',
      description: '',
      version: 1,
      changeType: ''
    });
  };

  const handleSave = async () => {
    if (!db || !projectId) return;
    const dbRef = db;
    setSaving(true);
    try {
      const batch = writeBatch(dbRef);
      const featureCol = collection(dbRef, 'projects', projectId, 'features');
      const existing = await getDocs(featureCol);
      existing.forEach((docSnap) => batch.delete(docSnap.ref));
      features.forEach((feature, index) => {
        const featureId = feature.id.startsWith('local-')
          ? `feature-${Date.now()}-${index}`
          : feature.id;
        const payload = {
          featureId,
          category1: feature.category1,
          category2: feature.category2,
          category3: feature.category3,
          category4: feature.category4 || '',
          description: feature.description,
          version: feature.version ?? 1,
          changeType: feature.changeType || ''
        };
        batch.set(doc(featureCol, featureId), payload);
      });
      await batch.commit();
    } catch (error) {
      console.warn('[Features] 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAIDraft = async (file: File) => {
    if (!storage || !functions || !projectId) return;
    setAiStatus('uploading');
    setAiMessage(null);
    try {
      const storagePath = `feature-drafts/${projectId}/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      setAiStatus('generating');
      const callable = httpsCallable(functions, 'generateFeatureDraft');
      const response = (await callable({ storagePath, projectId })) as { data: DraftResponse };
      const draft = response.data?.features || [];
      const normalized: FeatureItem[] = draft.map((item, index) => ({
        id: `ai-${Date.now()}-${index}`,
        category1: item.category1 || '미분류',
        category2: item.category2 || '미분류',
        category3: item.category3 || '미분류',
        category4: item.category4 || '',
        description: item.description || '',
        version: 1,
        changeType: ''
      }));
      if (normalized.length > 0) {
        setFeatures(normalized);
        setAiMessage(response.data?.message || 'AI 초안이 적용되었습니다.');
      } else {
        setAiMessage('AI 초안이 비어 있습니다. PDF 내용을 확인해주세요.');
      }
      setAiStatus('done');
    } catch (error) {
      console.warn('[Features] AI 초안 생성 실패:', error);
      setAiStatus('error');
      setAiMessage('AI 초안 생성에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold text-primary-900">기능 리스트 관리</h2>
        <p className="text-sm text-primary-500">AI 초안 생성 및 트리 구조 편집</p>
        {!projectId && (
          <div className="mt-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700">
            시험번호가 없습니다. 프로젝트를 먼저 선택해주세요.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2.1fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-surface-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-primary-900">AI 초안 생성</div>
                <div className="text-xs text-primary-500">제품 매뉴얼(PDF) 업로드 후 기능 리스트 초안 생성</div>
              </div>
              <label className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-primary-600 hover:border-surface-300">
                <UploadCloud size={14} />
                PDF 업로드
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void handleAIDraft(file);
                  }}
                  disabled={!projectId}
                />
              </label>
            </div>
            <div className="mt-2 text-xs text-primary-500">
              {aiStatus === 'uploading' && '업로드 중...'}
              {aiStatus === 'generating' && 'AI 초안 생성 중...'}
              {aiStatus === 'done' && (aiMessage || 'AI 초안이 적용되었습니다.')}
              {aiStatus === 'error' && (aiMessage || 'AI 초안 생성 실패')}
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-primary-900">트리 뷰 편집기</div>
              <div className="text-xs text-primary-400">{features.length}개 항목</div>
            </div>
            {loading ? (
              <div className="py-12 text-center text-sm text-primary-400">불러오는 중...</div>
            ) : (
              <div className="mt-3 space-y-3 max-h-[56vh] overflow-y-auto pr-2">
                {Object.entries(grouped).map(([c1, level2]) => (
                  <div key={c1} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                    <div className="text-sm font-semibold text-primary-800">{c1}</div>
                    {Object.entries(level2).map(([c2, level3]) => (
                      <div key={`${c1}-${c2}`} className="mt-2 ml-3">
                        <div className="text-xs font-semibold text-primary-700">{c2}</div>
                        {Object.entries(level3).map(([c3, level4]) => (
                          <div key={`${c1}-${c2}-${c3}`} className="mt-2 ml-3">
                            <div className="text-xs text-primary-600">{c3}</div>
                            {Object.entries(level4).map(([c4, items]) => (
                              <div key={`${c1}-${c2}-${c3}-${c4}`} className="mt-2 ml-3">
                                {c4 && <div className="text-[11px] text-primary-500">{c4}</div>}
                                <div className="space-y-2 mt-1">
                                  {items.map((item) => (
                                    <div key={item.id} className="rounded-lg border border-surface-200 bg-white p-3">
                                      {editId === item.id && editDraft ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <Input
                                            value={editDraft.category1}
                                            onChange={(e) =>
                                              setEditDraft({ ...editDraft, category1: e.target.value })
                                            }
                                            placeholder="대분류"
                                          />
                                          <Input
                                            value={editDraft.category2}
                                            onChange={(e) =>
                                              setEditDraft({ ...editDraft, category2: e.target.value })
                                            }
                                            placeholder="중분류"
                                          />
                                          <Input
                                            value={editDraft.category3}
                                            onChange={(e) =>
                                              setEditDraft({ ...editDraft, category3: e.target.value })
                                            }
                                            placeholder="소분류"
                                          />
                                          <Input
                                            value={editDraft.category4 || ''}
                                            onChange={(e) =>
                                              setEditDraft({ ...editDraft, category4: e.target.value })
                                            }
                                            placeholder="소소분류"
                                          />
                                          <Input
                                            className="md:col-span-2"
                                            value={editDraft.description}
                                            onChange={(e) =>
                                              setEditDraft({ ...editDraft, description: e.target.value })
                                            }
                                            placeholder="기능 설명"
                                          />
                                          <div className="flex justify-end gap-2 md:col-span-2">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                if (!editDraft) return;
                                                setFeatures((prev) =>
                                                  prev.map((f) => (f.id === editDraft.id ? { ...editDraft } : f))
                                                );
                                                setEditId(null);
                                                setEditDraft(null);
                                              }}
                                            >
                                              저장
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setEditId(null);
                                                setEditDraft(null);
                                              }}
                                            >
                                              취소
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="text-xs text-primary-700">
                                            {item.description || '설명 없음'}
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              icon={Pencil}
                                              onClick={() => {
                                                setEditId(item.id);
                                                setEditDraft({ ...item });
                                              }}
                                            >
                                              수정
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              icon={Trash2}
                                              onClick={() =>
                                                setFeatures((prev) => prev.filter((f) => f.id !== item.id))
                                              }
                                            >
                                              삭제
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
                {features.length === 0 && (
                  <div className="py-8 text-center text-xs text-primary-400">
                    등록된 기능 리스트가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-surface-200 bg-white p-4">
            <div className="text-sm font-semibold text-primary-900 mb-3">새 기능 추가</div>
            <div className="space-y-2">
              <Input
                placeholder="대분류"
                value={newFeature.category1}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, category1: e.target.value }))}
              />
              <Input
                placeholder="중분류"
                value={newFeature.category2}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, category2: e.target.value }))}
              />
              <Input
                placeholder="소분류"
                value={newFeature.category3}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, category3: e.target.value }))}
              />
              <Input
                placeholder="소소분류 (선택)"
                value={newFeature.category4 || ''}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, category4: e.target.value }))}
              />
              <Input
                placeholder="기능 설명"
                value={newFeature.description}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="버전 (예: 1.0)"
                  value={String(newFeature.version ?? 1)}
                  onChange={(e) =>
                    setNewFeature((prev) => ({ ...prev, version: Number(e.target.value) || 1 }))
                  }
                />
                <Input
                  placeholder="변경 유형"
                  value={newFeature.changeType || ''}
                  onChange={(e) => setNewFeature((prev) => ({ ...prev, changeType: e.target.value }))}
                />
              </div>
              <Button variant="secondary" icon={Plus} onClick={handleAddFeature}>
                기능 추가
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-4">
            <div className="text-sm font-semibold text-primary-900 mb-2">저장</div>
            <p className="text-xs text-primary-500 mb-3">
              변경사항을 프로젝트의 features 서브 컬렉션에 저장합니다.
            </p>
            <Button icon={Save} onClick={handleSave} disabled={saving || !projectId}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
