import { useMemo, useState } from 'react';
import { UploadCloud, Plus, Save, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { PageHeader, PageFilterBar, PageContent } from '../../../components/ui/layout';
import { useFeatureActions, type FeatureItem } from '../hooks/useFeatureActions';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

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

  const {
    features,
    loading,
    saving,
    aiStatus,
    aiMessage,
    addFeature,
    updateFeature,
    deleteFeature,
    saveFeatures,
    generateAiDraft
  } = useFeatureActions();

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

  const grouped = useMemo(() => groupFeatures(features), [features]);

  const handleAddFeature = () => {
    if (!newFeature.category1.trim() || !newFeature.category2.trim() || !newFeature.category3.trim()) return;
    if (!newFeature.description.trim()) return;
    addFeature({
      ...newFeature,
      category4: newFeature.category4?.trim() || ''
    });
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

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="기능 명세 관리"
        description="AI 초안 생성 및 트리 구조 편집"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Sparkles} disabled={!projectId}>
              AI 초안 생성
            </Button>
            <label className="inline-flex">
              <Button variant="secondary" size="sm" icon={UploadCloud} disabled={!projectId}>
                PDF 업로드
              </Button>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void generateAiDraft(file);
                }}
                disabled={!projectId}
              />
            </label>
          </div>
        }
      />

      <PageFilterBar>
        <div className="text-xs text-primary-500">
          {aiStatus === 'uploading' && '업로드 중...'}
          {aiStatus === 'generating' && 'AI 초안 생성 중...'}
          {aiStatus === 'done' && (aiMessage || 'AI 초안이 적용되었습니다.')}
          {aiStatus === 'error' && (aiMessage || 'AI 초안 생성 실패')}
        </div>
        {!projectId && (
          <span className="ml-auto text-xs text-warning-700 bg-warning-50 border border-warning-200 px-2 py-1 rounded">
            시험번호가 없습니다. 프로젝트를 먼저 선택해주세요.
          </span>
        )}
      </PageFilterBar>

      <PageContent className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-xl border border-surface-200 bg-surface-base p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-primary-900">트리 뷰 편집기</div>
              <div className="text-xs text-primary-400">{features.length}개 항목</div>
            </div>
            {loading ? (
              <div className="py-12 text-center text-sm text-primary-400">불러오는 중...</div>
            ) : (
              <div className="mt-3 space-y-3 flex-1 overflow-y-auto pr-2">
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
                                    <div key={item.id} className="rounded-lg border border-surface-200 bg-surface-base p-3">
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
                                                updateFeature({ ...editDraft });
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
                                              onClick={() => deleteFeature(item.id)}
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
          </section>

          <aside className="rounded-xl border border-surface-200 bg-surface-base p-4 space-y-4">
            <div>
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

            <div>
              <div className="text-sm font-semibold text-primary-900 mb-2">저장</div>
              <p className="text-xs text-primary-500 mb-3">
                변경사항을 프로젝트의 features 서브 컬렉션에 저장합니다.
              </p>
              <Button icon={Save} onClick={saveFeatures} disabled={saving || !projectId}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </aside>
        </div>
      </PageContent>
    </div>
  );
}
