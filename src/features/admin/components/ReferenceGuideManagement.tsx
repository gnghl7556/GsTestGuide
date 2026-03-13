import { useState } from 'react';
import { Plus, Pencil, Check, X, Trash2, RotateCcw } from 'lucide-react';
import { GUIDES } from 'virtual:content/guides';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../../components/ui';
import { AdminPageHeader } from '../shared';
import { useGuides } from '../../../hooks/useGuides';
import type { GuideCategory, GuideWithSource } from '../../../types/guide';

type CategoryFilter = 'all' | GuideCategory;

type GuideForm = {
  id: string;
  title: string;
  category: GuideCategory;
  icon: string;
  description: string;
  checkPoints: string[];
  tip: string;
};

const emptyForm: GuideForm = { id: '', title: '', category: 'reference', icon: '', description: '', checkPoints: [''], tip: '' };

const mdMap = new Map(GUIDES.map((r) => [r.id, r]));

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'reference', label: '참조 가이드' },
  { value: 'writing', label: '작성 가이드' },
];

export function ReferenceGuideManagement() {
  const allGuides = useGuides();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<GuideForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const guides = categoryFilter === 'all'
    ? allGuides
    : allGuides.filter(g => g.category === categoryFilter);

  const handleEditStart = (guide: GuideWithSource) => {
    setEditing(guide.id);
    setAdding(false);
    setForm({
      id: guide.id,
      title: guide.title,
      category: guide.category,
      icon: guide.icon,
      description: guide.description,
      checkPoints: (guide.checkPoints && guide.checkPoints.length > 0) ? [...guide.checkPoints] : [''],
      tip: guide.tip ?? '',
    });
  };

  const handleAddStart = () => {
    setAdding(true);
    setEditing(null);
    const refCount = allGuides.filter(g => g.category === 'reference').length;
    setForm({ ...emptyForm, id: `REF-${String(refCount + 1).padStart(2, '0')}`, checkPoints: [''] });
  };

  const handleSave = async () => {
    if (!db || !form.id.trim() || !form.title.trim()) return;
    setSaving(true);
    const cleanCps = form.checkPoints.map((cp) => cp.trim()).filter(Boolean);
    await setDoc(doc(db, 'referenceGuides', form.id.trim()), {
      title: form.title.trim(),
      category: form.category,
      icon: form.icon.trim(),
      description: form.description.trim(),
      checkPoints: cleanCps,
      tip: form.tip.trim(),
      updatedAt: serverTimestamp(),
    });
    setSaving(false);
    setEditing(null);
    setAdding(false);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'referenceGuides', id));
    setDeleteConfirm(null);
    if (editing === id) { setEditing(null); setForm(emptyForm); }
  };

  const handleReset = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'referenceGuides', id));
    if (editing === id) { setEditing(null); setForm(emptyForm); }
  };

  const handleCancel = () => {
    setEditing(null);
    setAdding(false);
    setForm(emptyForm);
  };

  const updateCheckpoint = (index: number, value: string) => {
    setForm((prev) => {
      const cps = [...prev.checkPoints];
      cps[index] = value;
      return { ...prev, checkPoints: cps };
    });
  };

  const addCheckpoint = () => {
    setForm((prev) => ({ ...prev, checkPoints: [...prev.checkPoints, ''] }));
  };

  const removeCheckpoint = (index: number) => {
    setForm((prev) => ({
      ...prev,
      checkPoints: prev.checkPoints.filter((_, i) => i !== index),
    }));
  };

  const isModified = (id: string) => {
    const guide = allGuides.find((g) => g.id === id);
    return guide?.source === 'firestore';
  };

  const isMarkdownOriginal = (id: string) => mdMap.has(id);

  const renderForm = () => (
    <div className="p-4 bg-accent-subtle space-y-3 rounded-lg border border-ln">
      {/* ID + Title + Category */}
      <div className="flex gap-3">
        <div className="w-28">
          <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">ID</label>
          <input
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            disabled={!!editing}
            placeholder="REF-03"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">제목</label>
          <input
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-sm text-tx-primary"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="가이드 제목"
            autoFocus
          />
        </div>
        <div className="w-24">
          <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">카테고리</label>
          <select
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2 py-1.5 text-xs text-tx-primary"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as GuideCategory })}
          >
            <option value="reference">참조</option>
            <option value="writing">작성</option>
          </select>
        </div>
      </div>

      {/* Icon + Description */}
      <div className="flex gap-3">
        <div className="w-16">
          <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">아이콘</label>
          <input
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-sm text-tx-primary text-center"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="📋"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">설명</label>
          <textarea
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-sm text-tx-primary resize-y min-h-[50px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="가이드 설명"
          />
        </div>
      </div>

      {/* Checkpoints (reference category) */}
      {form.category === 'reference' && (
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">체크포인트</label>
            <button
              type="button"
              onClick={addCheckpoint}
              className="text-[10px] font-semibold text-accent-text hover:text-accent-hover"
            >
              + 항목 추가
            </button>
          </div>
          <div className="mt-1 space-y-1.5">
            {form.checkPoints.map((cp, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="shrink-0 text-[10px] font-bold text-tx-tertiary w-4 text-right">{i + 1}</span>
                <input
                  className="flex-1 rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary"
                  value={cp}
                  onChange={(e) => updateCheckpoint(i, e.target.value)}
                  placeholder="체크포인트 내용"
                />
                {form.checkPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCheckpoint(i)}
                    className="shrink-0 rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tip (reference category) */}
      {form.category === 'reference' && (
        <div>
          <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">TIP</label>
          <textarea
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary resize-y min-h-[40px]"
            value={form.tip}
            onChange={(e) => setForm({ ...form, tip: e.target.value })}
            rows={2}
            placeholder="팁 내용 (선택)"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-1">
        <button onClick={handleSave} disabled={saving || !form.title.trim()} className="rounded p-1.5 text-status-pass-text hover:bg-status-pass-bg disabled:opacity-40" title="저장" aria-label="저장">
          <Check size={16} />
        </button>
        <button onClick={handleCancel} className="rounded p-1.5 text-tx-muted hover:bg-interactive-hover" title="취소" aria-label="취소">
          <X size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <AdminPageHeader
        title="가이드 관리"
        description={`참조 가이드 및 작성 가이드 내용을 추가·수정합니다. (${allGuides.length}건)`}
        action={
          <Button size="sm" onClick={handleAddStart} disabled={adding}>
            <Plus size={14} className="mr-1" />
            가이드 추가
          </Button>
        }
      />

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-4">
        {CATEGORY_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? allGuides.length
            : allGuides.filter(g => g.category === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategoryFilter(tab.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                categoryFilter === tab.value
                  ? 'bg-surface-sunken border-ln-strong text-tx-primary'
                  : 'border-ln text-tx-muted hover:border-ln-strong hover:text-tx-secondary'
              }`}
            >
              {tab.label} {count}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {adding && renderForm()}

        {guides.map((guide) => {
          if (editing === guide.id) {
            return <div key={guide.id}>{renderForm()}</div>;
          }

          const categoryLabel = guide.category === 'reference' ? '참조' : '작성';

          return (
            <div key={guide.id} className="rounded-xl border border-ln bg-surface-base overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="shrink-0 text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{guide.id}</span>
                  {guide.icon && <span className="text-sm">{guide.icon}</span>}
                  <span className="text-sm font-semibold text-tx-primary">{guide.title}</span>
                  <span className="shrink-0 text-[9px] font-bold text-tx-muted bg-surface-sunken px-1.5 py-0.5 rounded">{categoryLabel}</span>
                  {isModified(guide.id) && isMarkdownOriginal(guide.id) && (
                    <span className="shrink-0 text-[9px] font-bold text-status-modified-text bg-status-modified-bg px-1.5 py-0.5 rounded">수정됨</span>
                  )}
                  {!isMarkdownOriginal(guide.id) && (
                    <span className="shrink-0 text-[9px] font-bold text-accent-text bg-accent-subtle px-1.5 py-0.5 rounded">추가됨</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={() => handleEditStart(guide)} className="rounded p-1.5 text-tx-muted hover:text-accent-text hover:bg-accent-subtle" title="수정" aria-label="수정">
                    <Pencil size={14} />
                  </button>
                  {isModified(guide.id) && isMarkdownOriginal(guide.id) && (
                    <button onClick={() => handleReset(guide.id)} className="rounded p-1.5 text-tx-muted hover:text-status-modified-text hover:bg-status-modified-bg" title="원본으로 되돌리기" aria-label="원본으로 되돌리기">
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {!isMarkdownOriginal(guide.id) && (
                    deleteConfirm === guide.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(guide.id)} className="rounded px-2 py-0.5 text-xs font-semibold text-danger-text bg-danger-subtle">확인</button>
                        <button onClick={() => setDeleteConfirm(null)} className="rounded px-2 py-0.5 text-xs font-semibold text-tx-tertiary hover:bg-interactive-hover">취소</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(guide.id)} className="rounded p-1.5 text-tx-muted hover:text-danger-text hover:bg-danger-subtle" title="삭제" aria-label="삭제">
                        <Trash2 size={14} />
                      </button>
                    )
                  )}
                </div>
              </div>
              {/* Preview */}
              <div className="px-4 pb-3 space-y-1">
                {guide.description && (
                  <p className="text-xs text-tx-secondary line-clamp-2">{guide.description}</p>
                )}
                {guide.category === 'reference' && (
                  <p className="text-[10px] text-tx-muted">체크포인트 {(guide.checkPoints ?? []).length}개{guide.tip ? ' · TIP 있음' : ''}</p>
                )}
                {guide.category === 'writing' && (
                  <p className="text-[10px] text-tx-muted">섹션 {guide.sections.length}개</p>
                )}
              </div>
            </div>
          );
        })}

        {guides.length === 0 && !adding && (
          <div className="text-center py-8 text-sm text-tx-muted">등록된 가이드가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
