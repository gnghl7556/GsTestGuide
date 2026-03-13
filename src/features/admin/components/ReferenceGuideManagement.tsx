import { useState } from 'react';
import { Plus, Pencil, Check, X, Trash2, RotateCcw } from 'lucide-react';
import { GUIDES } from 'virtual:content/guides';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../../components/ui';
import { AdminPageHeader } from '../shared';
import { useGuides } from '../../../hooks/useGuides';
import type { GuideWithSource } from '../../../types/guide';

type GuideForm = {
  id: string;
  title: string;
  icon: string;
  description: string;
};

const emptyForm: GuideForm = { id: '', title: '', icon: '', description: '' };

const mdMap = new Map(GUIDES.map((r) => [r.id, r]));

export function ReferenceGuideManagement() {
  const allGuides = useGuides();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<GuideForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEditStart = (guide: GuideWithSource) => {
    setEditing(guide.id);
    setAdding(false);
    setForm({
      id: guide.id,
      title: guide.title,
      icon: guide.icon,
      description: guide.description,
    });
  };

  const handleAddStart = () => {
    setAdding(true);
    setEditing(null);
    const count = allGuides.length;
    setForm({ ...emptyForm, id: `GUIDE-${String(count + 1).padStart(2, '0')}` });
  };

  const handleSave = async () => {
    if (!db || !form.id.trim() || !form.title.trim()) return;
    setSaving(true);
    await setDoc(doc(db, 'referenceGuides', form.id.trim()), {
      title: form.title.trim(),
      icon: form.icon.trim(),
      description: form.description.trim(),
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

  const isModified = (id: string) => {
    const guide = allGuides.find((g) => g.id === id);
    return guide?.source === 'firestore';
  };

  const isMarkdownOriginal = (id: string) => mdMap.has(id);

  const renderForm = () => (
    <div className="p-4 bg-accent-subtle space-y-3 rounded-lg border border-ln">
      <div className="flex gap-3">
        <div className="w-28">
          <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">ID</label>
          <input
            className="mt-1 w-full rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            disabled={!!editing}
            placeholder="GUIDE-01"
          />
        </div>
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
        description={`가이드 내용을 추가·수정합니다. (${allGuides.length}건)`}
        action={
          <Button size="sm" onClick={handleAddStart} disabled={adding}>
            <Plus size={14} className="mr-1" />
            가이드 추가
          </Button>
        }
      />

      <div className="space-y-3">
        {adding && renderForm()}

        {allGuides.map((guide) => {
          if (editing === guide.id) {
            return <div key={guide.id}>{renderForm()}</div>;
          }

          return (
            <div key={guide.id} className="rounded-xl border border-ln bg-surface-base overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="shrink-0 text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{guide.id}</span>
                  {guide.icon && <span className="text-sm">{guide.icon}</span>}
                  <span className="text-sm font-semibold text-tx-primary">{guide.title}</span>
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
              <div className="px-4 pb-3 space-y-1">
                {guide.description && (
                  <p className="text-xs text-tx-secondary line-clamp-2">{guide.description}</p>
                )}
                <p className="text-[10px] text-tx-muted">섹션 {guide.sections.length}개</p>
              </div>
            </div>
          );
        })}

        {allGuides.length === 0 && !adding && (
          <div className="text-center py-8 text-sm text-tx-muted">등록된 가이드가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
