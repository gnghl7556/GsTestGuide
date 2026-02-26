import { useState, useMemo, useRef, useEffect, useCallback, Fragment } from 'react';
import { Plus, Pencil, Trash2, Check, X, Upload, Image, FileDown, Loader2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db, storage } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { Button } from '../../../components/ui';

type FileInfo = {
  name: string;
  url: string;
  fullPath: string;
};

type DocMaterial = {
  label: string;
  kind: string;
  description: string;
  linkedSteps: string[];
  hidden?: boolean;
};

type FormData = DocMaterial;

const emptyForm: FormData = { label: '', kind: 'file', description: '', linkedSteps: [] };

/** All checklist step options derived from REQUIREMENTS_DB */
const ALL_STEPS = REQUIREMENTS_DB.map((r) => ({ id: r.id, title: r.title }));

export function MaterialManagement() {
  const [docs, setDocs] = useState<DocMaterial[]>([]);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // File management state
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [fileState, setFileState] = useState<Record<string, { previewFiles: FileInfo[]; sampleFiles: FileInfo[]; loaded: boolean }>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const activeUploadRef = useRef<{ label: string; type: 'preview' | 'sample' } | null>(null);

  // Collect which steps reference each doc label (from markdown)
  const markdownUsageMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const req of REQUIREMENTS_DB) {
      if (!req.requiredDocs) continue;
      for (const d of req.requiredDocs) {
        if (!map[d.label]) map[d.label] = [];
        if (!map[d.label].includes(req.id)) map[d.label].push(req.id);
      }
    }
    return map;
  }, []);

  // Seed docs from markdown (unique by label)
  const markdownDocs = useMemo(() => {
    const seen = new Set<string>();
    const result: DocMaterial[] = [];
    for (const req of REQUIREMENTS_DB) {
      if (!req.requiredDocs) continue;
      for (const d of req.requiredDocs) {
        if (seen.has(d.label)) continue;
        seen.add(d.label);
        result.push({
          label: d.label,
          kind: d.kind ?? 'file',
          description: d.description ?? '',
          linkedSteps: markdownUsageMap[d.label] ?? [],
        });
      }
    }
    return result;
  }, [markdownUsageMap]);

  // Subscribe to Firestore docMaterials
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'docMaterials'), (snap) => {
      const firestoreDocs: DocMaterial[] = [];
      const firestoreLabels = new Set<string>();
      const hiddenLabels = new Set<string>();
      snap.forEach((d) => {
        const data = d.data() as DocMaterial;
        if (data.hidden) {
          hiddenLabels.add(data.label);
          return;
        }
        firestoreDocs.push({ ...data, linkedSteps: data.linkedSteps ?? [] });
        firestoreLabels.add(data.label);
      });

      // Merge: Firestore overrides markdown defaults, hidden items excluded
      const merged: DocMaterial[] = [...firestoreDocs];
      for (const md of markdownDocs) {
        if (!firestoreLabels.has(md.label) && !hiddenLabels.has(md.label)) {
          merged.push(md);
        }
      }
      setDocs(merged);
    });
    return () => unsub();
  }, [markdownDocs]);

  const docId = (label: string) => label.replace(/[\\/\s]/g, '-');

  const toggleStep = useCallback((stepId: string) => {
    setForm((prev) => {
      const has = prev.linkedSteps.includes(stepId);
      return {
        ...prev,
        linkedSteps: has
          ? prev.linkedSteps.filter((s) => s !== stepId)
          : [...prev.linkedSteps, stepId],
      };
    });
  }, []);

  const handleAdd = async () => {
    if (!form.label.trim() || !db) return;
    const snapshot = { ...form };
    setBusy(true);
    await setDoc(doc(db, 'docMaterials', docId(snapshot.label)), {
      label: snapshot.label.trim(),
      kind: snapshot.kind,
      description: snapshot.description.trim(),
      linkedSteps: snapshot.linkedSteps,
      updatedAt: serverTimestamp(),
    });
    setBusy(false);
    setForm(emptyForm);
    setShowAddForm(false);
  };

  const handleEditStart = (d: DocMaterial) => {
    setEditingLabel(d.label);
    setForm({
      label: d.label,
      kind: d.kind,
      description: d.description,
      linkedSteps: d.linkedSteps ?? [],
    });
  };

  const handleEditSave = async () => {
    if (!editingLabel || !db) return;
    const oldLabel = editingLabel;
    const newLabel = form.label.trim();
    if (!newLabel) return;
    const snapshot = { ...form };
    setBusy(true);

    // If label changed, delete old doc and create new one
    if (newLabel !== oldLabel) {
      await deleteDoc(doc(db, 'docMaterials', docId(oldLabel)));
    }
    await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
      label: newLabel,
      kind: snapshot.kind,
      description: snapshot.description.trim(),
      linkedSteps: snapshot.linkedSteps,
      updatedAt: serverTimestamp(),
    });
    setBusy(false);
    setEditingLabel((cur) => (cur === oldLabel ? null : cur));
    setForm((cur) => (cur.label === newLabel ? emptyForm : cur));
  };

  const markdownLabelSet = useMemo(
    () => new Set(markdownDocs.map((md) => md.label)),
    [markdownDocs],
  );

  const handleDelete = async (label: string) => {
    if (!db || busy) return;
    setBusy(true);
    try {
      if (markdownLabelSet.has(label)) {
        await setDoc(doc(db, 'docMaterials', docId(label)), { label, hidden: true, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await deleteDoc(doc(db, 'docMaterials', docId(label)));
      }
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  // --- File management ---

  const loadFilesForDoc = async (label: string) => {
    if (!storage) return;
    try {
      const [previewResult, sampleResult] = await Promise.all([
        listAll(ref(storage, `checklist-previews/${label}`)).catch(() => ({ items: [] as never[] })),
        listAll(ref(storage, `sample-downloads/${label}`)).catch(() => ({ items: [] as never[] })),
      ]);
      const previewFiles = await Promise.all(
        previewResult.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url, fullPath: item.fullPath };
        })
      );
      const sampleFiles = await Promise.all(
        sampleResult.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url, fullPath: item.fullPath };
        })
      );
      setFileState((prev) => ({ ...prev, [label]: { previewFiles, sampleFiles, loaded: true } }));
    } catch (e) {
      console.error('Failed to load files for', label, e);
    }
  };

  const toggleExpand = (label: string) => {
    setExpandedDoc((prev) => {
      const next = prev === label ? null : label;
      if (next && !fileState[next]?.loaded) {
        void loadFilesForDoc(next);
      }
      return next;
    });
  };

  const handleFileUpload = async (file: File, label: string, type: 'preview' | 'sample') => {
    if (!storage) return;
    const folder = type === 'preview' ? 'checklist-previews' : 'sample-downloads';
    const path = `${folder}/${label}/${file.name}`;
    setUploading(`${label}-${type}`);
    try {
      await uploadBytes(ref(storage, path), file);
      await loadFilesForDoc(label);
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(null);
  };

  const handleFileDelete = async (fullPath: string, label: string) => {
    if (!storage) return;
    try {
      await deleteObject(ref(storage, fullPath));
      await loadFilesForDoc(label);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const triggerUpload = (label: string, type: 'preview' | 'sample') => {
    activeUploadRef.current = { label, type };
    if (type === 'preview') previewInputRef.current?.click();
    else sampleInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const upload = activeUploadRef.current;
    if (file && upload) {
      void handleFileUpload(file, upload.label, upload.type);
    }
    e.target.value = '';
    activeUploadRef.current = null;
  };

  /** Render toggle chips for linkedSteps */
  const renderStepChips = () => (
    <div className="flex flex-wrap gap-1">
      {ALL_STEPS.map((step) => {
        const selected = form.linkedSteps.includes(step.id);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => toggleStep(step.id)}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
              selected
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-surface-sunken text-tx-muted border-ln hover:border-ln-strong'
            }`}
            title={step.title}
          >
            {step.id}
          </button>
        );
      })}
    </div>
  );

  /** Render linkedSteps badges for display mode */
  const renderStepBadges = (d: DocMaterial) => {
    const mdSteps = markdownUsageMap[d.label] ?? [];
    const allSteps = Array.from(new Set([...mdSteps, ...d.linkedSteps]));
    if (allSteps.length === 0) return <span className="text-xs text-tx-muted">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {allSteps.map((sid) => (
          <span
            key={sid}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-sunken text-tx-muted border border-ln"
            title={ALL_STEPS.find((s) => s.id === sid)?.title ?? sid}
          >
            {sid}
          </span>
        ))}
      </div>
    );
  };

  const renderFilePanel = (label: string) => {
    const mat = fileState[label];
    const isUploadingPreview = uploading === `${label}-preview`;
    const isUploadingSample = uploading === `${label}-sample`;

    return (
      <tr className="border-b border-ln">
        <td colSpan={6} className="px-6 py-4 bg-surface-sunken">
          {!mat?.loaded ? (
            <div className="flex items-center gap-2 text-xs text-tx-muted py-2">
              <Loader2 size={14} className="animate-spin" />
              로딩 중...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Preview Image */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-tx-muted uppercase tracking-wide flex items-center gap-1.5">
                  <Image size={12} />
                  미리보기 이미지
                </div>
                {mat.previewFiles.length === 0 && (
                  <div className="text-xs text-tx-muted">업로드된 이미지 없음</div>
                )}
                {mat.previewFiles.map((f) => (
                  <div key={f.fullPath} className="flex items-center gap-2.5 text-xs bg-surface-base rounded-lg px-3 py-2 border border-ln">
                    <img src={f.url} alt={f.name} className="h-10 w-10 rounded object-cover border border-ln" />
                    <span className="flex-1 truncate text-tx-secondary">{f.name}</span>
                    <button onClick={() => handleFileDelete(f.fullPath, label)} className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle" title="삭제">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); triggerUpload(label, 'preview'); }}
                  disabled={isUploadingPreview}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-text hover:text-accent-hover disabled:opacity-50 mt-1"
                >
                  {isUploadingPreview ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  이미지 업로드
                </button>
              </div>
              {/* Sample File */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-tx-muted uppercase tracking-wide flex items-center gap-1.5">
                  <FileDown size={12} />
                  샘플 파일
                </div>
                {mat.sampleFiles.length === 0 && (
                  <div className="text-xs text-tx-muted">업로드된 파일 없음</div>
                )}
                {mat.sampleFiles.map((f) => (
                  <div key={f.fullPath} className="flex items-center gap-2.5 text-xs bg-surface-base rounded-lg px-3 py-2 border border-ln">
                    <FileDown size={14} className="text-tx-muted shrink-0" />
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-accent-text hover:text-accent-hover underline">{f.name}</a>
                    <button onClick={() => handleFileDelete(f.fullPath, label)} className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle" title="삭제">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); triggerUpload(label, 'sample'); }}
                  disabled={isUploadingSample}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-text hover:text-accent-hover disabled:opacity-50 mt-1"
                >
                  {isUploadingSample ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  파일 업로드
                </button>
              </div>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-tx-primary">자료 관리</h1>
          <p className="text-xs text-tx-tertiary mt-1">
            참조 문서별 미리보기·샘플 파일을 관리하고, 점검항목에 연결합니다. ({docs.length}건)
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowAddForm(true); setForm(emptyForm); }}>
          <Plus size={14} className="mr-1" />
          자료 추가
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input ref={previewInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
      <input ref={sampleInputRef} type="file" className="hidden" onChange={onFileSelected} />

      <div className="rounded-xl border border-ln bg-surface-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ln bg-surface-raised">
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary min-w-[280px]">자료명</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-20">종류</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary w-48">연결 항목</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-tx-secondary">설명</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-tx-secondary w-24">작업</th>
              </tr>
            </thead>
            <tbody>
              {/* Add form */}
              {showAddForm && (
                <tr className="border-b border-ln bg-accent-subtle">
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-base text-tx-primary"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="예: 시험 계획서"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-base text-tx-primary"
                      value={form.kind}
                      onChange={(e) => setForm({ ...form, kind: e.target.value })}
                    >
                      <option value="file">File</option>
                      <option value="external">External</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">{renderStepChips()}</td>
                  <td className="px-4 py-2">
                    <textarea
                      className="w-full rounded border border-ln px-2.5 py-1.5 text-sm bg-surface-sunken resize-none leading-relaxed"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="팝업에 표시될 자료 설명을 입력하세요"
                      rows={3}
                    />
                  </td>
                  <td className="px-4 py-2 text-right align-top">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={handleAdd} disabled={busy} className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg" title="저장">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setShowAddForm(false)} className="rounded p-1 text-tx-muted hover:bg-interactive-hover" title="취소">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {/* Rows */}
              {docs.map((d) => {
                const isExpanded = expandedDoc === d.label;

                if (editingLabel === d.label) {
                  return (
                    <Fragment key={d.label}>
                      <tr className="border-b border-ln bg-accent-subtle">
                        <td className="px-4 py-2">
                          <input
                            className="w-full rounded border border-ln px-2 py-1 text-sm font-semibold bg-surface-base text-tx-primary"
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="w-full rounded border border-ln px-2 py-1 text-sm bg-surface-base text-tx-primary"
                            value={form.kind}
                            onChange={(e) => setForm({ ...form, kind: e.target.value })}
                          >
                            <option value="file">File</option>
                            <option value="external">External</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">{renderStepChips()}</td>
                        <td className="px-4 py-2">
                          <textarea
                            className="w-full rounded border border-ln px-2.5 py-1.5 text-sm bg-surface-sunken resize-none leading-relaxed"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="팝업에 표시될 자료 설명을 입력하세요"
                            rows={3}
                          />
                        </td>
                        <td className="px-4 py-2 text-right align-top">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={handleEditSave} disabled={busy} className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg" title="저장">
                              <Check size={16} />
                            </button>
                            <button onClick={() => { setEditingLabel(null); setForm(emptyForm); }} className="rounded p-1 text-tx-muted hover:bg-interactive-hover" title="취소">
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && renderFilePanel(d.label)}
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={d.label}>
                    <tr className={`border-b border-ln transition-colors ${isExpanded ? 'bg-surface-raised' : 'hover:bg-interactive-hover'}`}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => toggleExpand(d.label)} className="flex items-center gap-2 text-left w-full">
                          {isExpanded
                            ? <ChevronUp size={13} className="text-tx-muted shrink-0" />
                            : <ChevronDown size={13} className="text-tx-muted shrink-0" />
                          }
                          <span className="font-semibold text-tx-primary whitespace-nowrap">{d.label}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          d.kind === 'external'
                            ? 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        }`}>
                          {d.kind === 'external' ? 'External' : 'File'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{renderStepBadges(d)}</td>
                      <td className="px-4 py-3 text-xs text-tx-tertiary">{d.description || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditStart(d)} className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle" title="수정">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(d.label)} disabled={busy} className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle disabled:opacity-40" title="삭제">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && renderFilePanel(d.label)}
                  </Fragment>
                );
              })}
              {docs.length === 0 && !showAddForm && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-tx-muted">
                    등록된 자료가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-ln bg-surface-overlay shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-50 dark:bg-red-500/10 shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-tx-primary">자료 삭제</h3>
                <p className="text-xs text-tx-tertiary mt-0.5">
                  <strong className="text-tx-secondary">{deleteTarget}</strong> 자료를 삭제하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
                className="rounded-lg border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                disabled={busy}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60 flex items-center gap-1.5"
              >
                {busy && <Loader2 size={12} className="animate-spin" />}
                {busy ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DB 작업 중 차단 오버레이 (삭제 모달 외 작업: 저장, 수정) */}
      {busy && !deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface-overlay border border-ln shadow-xl px-5 py-3">
            <Loader2 size={16} className="animate-spin text-accent" />
            <span className="text-sm font-semibold text-tx-primary">저장 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
