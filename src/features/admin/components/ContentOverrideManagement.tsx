import { useState, useEffect, useMemo } from 'react';
import { Pencil, Check, X, RotateCcw, ChevronDown, ChevronRight, FileDown } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import type { ContentOverride } from '../../../lib/content/mergeOverrides';
import type { RequirementCategory } from '../../../types';

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  SETUP: '시험 준비',
  EXECUTION: '시험 수행',
  COMPLETION: '시험 종료',
};

const CATEGORY_ORDER: RequirementCategory[] = ['SETUP', 'EXECUTION', 'COMPLETION'];

const REF_PATTERN = /\s*\[ref:\s*(.+?)\]\s*$/;

/** 체크포인트 텍스트에서 본문과 [ref:~] 부분을 분리 */
const splitRef = (text: string): { body: string; refSuffix: string; refs: string[] } => {
  const match = text.match(REF_PATTERN);
  if (!match) return { body: text, refSuffix: '', refs: [] };
  const refs = match[1].split(',').map((r) => r.trim()).filter(Boolean);
  return {
    body: text.replace(REF_PATTERN, '').trim(),
    refSuffix: match[0],
    refs,
  };
};

/** 편집된 본문 + 원본 ref 접미사를 다시 합침 */
const joinRef = (body: string, refSuffix: string): string =>
  refSuffix ? `${body.trim()} ${refSuffix.trim()}` : body.trim();

type EditingState = {
  reqId: string;
  title: string;
  description: string;
  checkpoints: Record<number, string>; // body only (without [ref:~])
};

export function ContentOverrideManagement() {
  const [overrides, setOverrides] = useState<Record<string, ContentOverride>>({});
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<RequirementCategory>>(
    new Set(CATEGORY_ORDER),
  );

  // Subscribe to Firestore contentOverrides
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'contentOverrides'), (snap) => {
      const result: Record<string, ContentOverride> = {};
      snap.forEach((d) => {
        result[d.id] = d.data() as ContentOverride;
      });
      setOverrides(result);
    });
    return () => unsub();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<RequirementCategory, typeof REQUIREMENTS_DB> = {
      SETUP: [],
      EXECUTION: [],
      COMPLETION: [],
    };
    for (const req of REQUIREMENTS_DB) {
      map[req.category].push(req);
    }
    return map;
  }, []);

  const overrideCount = Object.keys(overrides).length;

  const toggleCategory = (cat: RequirementCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleEditStart = (reqId: string) => {
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    if (!req) return;
    const ov = overrides[reqId];
    setEditing({
      reqId,
      title: ov?.title ?? req.title,
      description: ov?.description ?? req.description,
      // 편집 시 body만 저장 (ref 제외)
      checkpoints: Object.fromEntries(
        (req.checkPoints ?? []).map((cp, i) => {
          const full = ov?.checkpoints?.[i] ?? cp;
          return [i, splitRef(full).body];
        }),
      ),
    });
  };

  const handleSave = async () => {
    if (!editing || !db) return;
    const req = REQUIREMENTS_DB.find((r) => r.id === editing.reqId);
    if (!req) return;

    // Only save fields that differ from markdown original
    const patch: ContentOverride = { updatedAt: serverTimestamp(), updatedBy: 'admin' };
    if (editing.title !== req.title) patch.title = editing.title;
    if (editing.description !== req.description) patch.description = editing.description;

    const cpDiffs: Record<number, string> = {};
    for (const [iStr, editedBody] of Object.entries(editing.checkpoints)) {
      const i = Number(iStr);
      const origFull = req.checkPoints?.[i] ?? '';
      const { body: origBody, refSuffix } = splitRef(origFull);
      if (editedBody !== origBody) {
        // 편집된 본문 + 원본 [ref:~] 접미사 재결합
        cpDiffs[i] = joinRef(editedBody, refSuffix);
      }
    }
    if (Object.keys(cpDiffs).length > 0) patch.checkpoints = cpDiffs;

    // If nothing changed, delete override
    if (!patch.title && !patch.description && !patch.checkpoints) {
      await deleteDoc(doc(db, 'contentOverrides', editing.reqId));
    } else {
      setSaving(true);
      await setDoc(doc(db, 'contentOverrides', editing.reqId), patch);
      setSaving(false);
    }
    setEditing(null);
  };

  const handleReset = async (reqId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'contentOverrides', reqId));
    if (editing?.reqId === reqId) setEditing(null);
  };

  const hasOverride = (reqId: string) => reqId in overrides;

  const getDisplayValue = (reqId: string, field: 'title' | 'description') => {
    const req = REQUIREMENTS_DB.find((r) => r.id === reqId);
    if (!req) return '';
    const ov = overrides[reqId];
    if (field === 'title') return ov?.title ?? req.title;
    return ov?.description ?? req.description;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-tx-primary">콘텐츠 관리</h1>
        <p className="text-xs text-tx-tertiary mt-1">
          점검항목의 제목, 설명, 체크포인트 문구를 수정합니다. 원본(마크다운)과 다른 항목은 뱃지로 표시됩니다. ({overrideCount}건 수정됨)
        </p>
      </div>

      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          const expanded = expandedCategories.has(cat);
          return (
            <div key={cat} className="rounded-xl border border-ln bg-surface-base overflow-hidden">
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="flex w-full items-center gap-2 px-4 py-3 bg-surface-raised hover:bg-interactive-hover transition-colors"
              >
                {expanded
                  ? <ChevronDown size={16} className="text-tx-muted" />
                  : <ChevronRight size={16} className="text-tx-muted" />
                }
                <span className="text-sm font-bold text-tx-primary">{CATEGORY_LABELS[cat]}</span>
                <span className="text-[10px] font-semibold text-tx-tertiary">({items.length}개 항목)</span>
              </button>

              {expanded && (
                <div className="divide-y divide-ln">
                  {items.map((req) => {
                    const isEditing = editing?.reqId === req.id;
                    const modified = hasOverride(req.id);

                    if (isEditing && editing) {
                      return (
                        <div key={req.id} className="p-4 bg-accent-subtle space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{req.id}</span>
                              <span className="text-xs font-semibold text-accent-text">편집 중</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={handleSave} disabled={saving} className="rounded p-1.5 text-status-pass-text hover:bg-status-pass-bg" title="저장">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditing(null)} className="rounded p-1.5 text-tx-muted hover:bg-interactive-hover" title="취소">
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Title field */}
                          <div>
                            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">제목</label>
                            <input
                              className="mt-1 w-full rounded border border-ln bg-surface-base px-3 py-2 text-sm text-tx-primary"
                              value={editing.title}
                              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                            />
                            {editing.title !== req.title && (
                              <p className="mt-0.5 text-[10px] text-tx-muted">원본: {req.title}</p>
                            )}
                          </div>

                          {/* Description field */}
                          <div>
                            <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">설명</label>
                            <textarea
                              className="mt-1 w-full rounded border border-ln bg-surface-base px-3 py-2 text-sm text-tx-primary resize-y min-h-[60px]"
                              value={editing.description}
                              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                              rows={3}
                            />
                            {editing.description !== req.description && (
                              <p className="mt-0.5 text-[10px] text-tx-muted line-clamp-2">원본: {req.description}</p>
                            )}
                          </div>

                          {/* Checkpoints */}
                          {req.checkPoints && req.checkPoints.length > 0 && (
                            <div>
                              <label className="text-[10px] font-bold text-tx-tertiary uppercase tracking-wider">체크포인트</label>
                              <div className="mt-1 space-y-1.5">
                                {req.checkPoints.map((origCp, i) => {
                                  const { body: origBody, refs } = splitRef(origCp);
                                  const editedBody = editing.checkpoints[i] ?? origBody;
                                  return (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="shrink-0 mt-2 text-[10px] font-bold text-tx-tertiary w-5 text-right">{i + 1}</span>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            className="flex-1 rounded border border-ln bg-surface-base px-2.5 py-1.5 text-xs text-tx-primary"
                                            value={editedBody}
                                            onChange={(e) => setEditing({
                                              ...editing,
                                              checkpoints: { ...editing.checkpoints, [i]: e.target.value },
                                            })}
                                          />
                                          {refs.length > 0 && refs.map((r) => (
                                            <span
                                              key={r}
                                              className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold text-tx-tertiary bg-surface-sunken px-1.5 py-1 rounded border border-ln"
                                              title="관련 자료 (자료 관리에서 편집)"
                                            >
                                              <FileDown size={9} />
                                              {r}
                                            </span>
                                          ))}
                                        </div>
                                        {editedBody !== origBody && (
                                          <p className="mt-0.5 text-[9px] text-tx-muted truncate">원본: {origBody}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={req.id} className="flex items-center justify-between px-4 py-3 hover:bg-interactive-hover transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="shrink-0 text-[10px] font-bold text-tx-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{req.id}</span>
                          <span className="text-sm font-semibold text-tx-primary truncate">
                            {getDisplayValue(req.id, 'title')}
                          </span>
                          {modified && (
                            <span className="shrink-0 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">수정됨</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => handleEditStart(req.id)}
                            className="rounded p-1.5 text-tx-muted hover:text-accent-text hover:bg-accent-subtle"
                            title="수정"
                          >
                            <Pencil size={14} />
                          </button>
                          {modified && (
                            <button
                              onClick={() => handleReset(req.id)}
                              className="rounded p-1.5 text-tx-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                              title="원본으로 되돌리기"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
