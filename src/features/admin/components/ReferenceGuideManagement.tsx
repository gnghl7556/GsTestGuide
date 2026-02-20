import { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X, Trash2, RotateCcw } from 'lucide-react';
import { REFERENCES } from 'virtual:content/references';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../../components/ui';
import type { ReferenceGuide } from 'virtual:content/references';

type GuideForm = {
  id: string;
  title: string;
  description: string;
  checkPoints: string[];
  tip: string;
};

const emptyForm: GuideForm = { id: '', title: '', description: '', checkPoints: [''], tip: '' };

const mdMap = new Map(REFERENCES.map((r) => [r.id, r]));

export function ReferenceGuideManagement() {
  const [guides, setGuides] = useState<(ReferenceGuide & { source: 'markdown' | 'firestore' })[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // guide id
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<GuideForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'referenceGuides'), (snap) => {
      const dbGuides: Record<string, ReferenceGuide> = {};
      snap.forEach((d) => {
        const data = d.data();
        dbGuides[d.id] = {
          id: d.id,
          title: data.title ?? '',
          description: data.description ?? '',
          checkPoints: data.checkPoints ?? [],
          tip: data.tip ?? '',
        };
      });

      const mdIds = new Set(REFERENCES.map((r) => r.id));
      const merged = REFERENCES.map((r) => {
        const ov = dbGuides[r.id];
        if (!ov) return { ...r, source: 'markdown' as const };
        return { ...ov, source: 'firestore' as const };
      });
      for (const [id, guide] of Object.entries(dbGuides)) {
        if (!mdIds.has(id)) merged.push({ ...guide, source: 'firestore' as const });
      }
      setGuides(merged);
    });
    return () => unsub();
  }, []);

  const handleEditStart = (guide: ReferenceGuide) => {
    setEditing(guide.id);
    setAdding(false);
    setForm({
      id: guide.id,
      title: guide.title,
      description: guide.description,
      checkPoints: guide.checkPoints.length > 0 ? [...guide.checkPoints] : [''],
      tip: guide.tip,
    });
  };

  const handleAddStart = () => {
    setAdding(true);
    setEditing(null);
    const nextNum = guides.length + 1;
    setForm({ ...emptyForm, id: `REF-${String(nextNum).padStart(2, '0')}`, checkPoints: [''] });
  };

  const handleSave = async () => {
    if (!db || !form.id.trim() || !form.title.trim()) return;
    setSaving(true);
    const cleanCps = form.checkPoints.map((cp) => cp.trim()).filter(Boolean);
    await setDoc(doc(db, 'referenceGuides', form.id.trim()), {
      title: form.title.trim(),
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
    const guide = guides.find((g) => g.id === id);
    return guide?.source === 'firestore';
  };

  const isMarkdownOriginal = (id: string) => mdMap.has(id);

  const renderForm = () => (
    <div className="p-4 bg-accent-subtle space-y-3 rounded-lg border border-ln">
      {/* ID + Title */}
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
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">설명</label>
        <textarea
          className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-sm text-tx-primary resize-y min-h-[50px]"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="가이드 설명"
        />
      </div>

      {/* Checkpoints */}
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

      {/* Tip */}
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

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-1">
        <button onClick={handleSave} disabled={saving || !form.title.trim()} className="rounded p-1.5 text-status-pass-text hover:bg-status-pass-bg disabled:opacity-40" title="저장">
          <Check size={16} />
        </button>
        <button onClick={handleCancel} className="rounded p-1.5 text-tx-muted hover:bg-interactive-hover" title="취소">
          <X size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-tx-primary">참조 가이드 관리</h1>
          <p className="text-xs text-tx-tertiary mt-1">
            체크리스트 좌측 하단의 참조 가이드 내용을 추가·수정합니다. ({guides.length}건)
          </p>
        </div>
        <Button size="sm" onClick={handleAddStart} disabled={adding}>
          <Plus size={14} className="mr-1" />
          가이드 추가
        </Button>
      </div>

      <div className="space-y-3">
        {adding && renderForm()}

        {guides.map((guide) => {
          if (editing === guide.id) {
            return <div key={guide.id}>{renderForm()}</div>;
          }

          return (
            <div key={guide.id} className="rounded-xl border border-ln bg-surface-base overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="shrink-0 text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{guide.id}</span>
                  <span className="text-sm font-semibold text-tx-primary">{guide.title}</span>
                  {isModified(guide.id) && isMarkdownOriginal(guide.id) && (
                    <span className="shrink-0 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">수정됨</span>
                  )}
                  {!isMarkdownOriginal(guide.id) && (
                    <span className="shrink-0 text-[9px] font-bold text-accent-text bg-accent-subtle px-1.5 py-0.5 rounded">추가됨</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={() => handleEditStart(guide)} className="rounded p-1.5 text-tx-muted hover:text-accent-text hover:bg-accent-subtle" title="수정">
                    <Pencil size={14} />
                  </button>
                  {isModified(guide.id) && isMarkdownOriginal(guide.id) && (
                    <button onClick={() => handleReset(guide.id)} className="rounded p-1.5 text-tx-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10" title="원본으로 되돌리기">
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
                      <button onClick={() => setDeleteConfirm(guide.id)} className="rounded p-1.5 text-tx-muted hover:text-danger-text hover:bg-danger-subtle" title="삭제">
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
                <p className="text-[10px] text-tx-muted">체크포인트 {guide.checkPoints.length}개{guide.tip ? ' · TIP 있음' : ''}</p>
              </div>
            </div>
          );
        })}

        {guides.length === 0 && !adding && (
          <div className="text-center py-8 text-sm text-tx-muted">등록된 참조 가이드가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
