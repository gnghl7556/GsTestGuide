import { useState, useMemo, useRef, useEffect, useCallback, Fragment } from 'react';
import { Plus, Pencil, Trash2, Check, X, Upload, Image, FileDown, Loader2, ChevronDown, ChevronUp, AlertTriangle, Link2 } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { db, storage } from '../../../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, getBytes } from 'firebase/storage';
import { Button } from '../../../components/ui';
import { AdminPageHeader, AdminTable, BusyOverlay, StepChips } from '../shared';
import { useAdminCrud } from '../hooks/useAdminCrud';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

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
  previewPaths?: string[];
  samplePaths?: string[];
};

type FormData = DocMaterial;

const emptyForm: FormData = { label: '', kind: 'file', description: '', linkedSteps: [] };

const BASE_COLUMNS = [
  { label: '자료명', className: 'min-w-[280px]' },
  { label: '종류', className: 'w-20' },
  { label: '연결 항목', className: 'w-48' },
  { label: '설명' },
  { label: '작업', className: 'w-24', align: 'right' as const },
];

export function MaterialManagement() {
  const [docs, setDocs] = useState<DocMaterial[]>([]);
  const {
    form, setForm,
    editingKey: editingLabel, setEditingKey: setEditingLabel,
    showAddForm, setShowAddForm,
    deleteTarget, setDeleteTarget,
    busy, setBusy,
    startAdd, cancelEdit,
  } = useAdminCrud<FormData>(emptyForm);

  // Bulk selection state
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [bulkLinkOpen, setBulkLinkOpen] = useState(false);
  const [bulkLinkSteps, setBulkLinkSteps] = useState<string[]>([]);

  const toggleSelect = (label: string) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedLabels((prev) => prev.size === docs.length ? new Set() : new Set(docs.map((d) => d.label)));
  };

  const handleBulkLink = async () => {
    if (!db || selectedLabels.size === 0 || bulkLinkSteps.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(
        [...selectedLabels].map((label) => {
          const existing = docs.find((d) => d.label === label);
          const merged = Array.from(new Set([...(existing?.linkedSteps ?? []), ...bulkLinkSteps]));
          return setDoc(doc(db!, 'docMaterials', docId(label)), { label, linkedSteps: merged, updatedAt: serverTimestamp() }, { merge: true });
        })
      );
    } finally {
      setBusy(false);
      setBulkLinkOpen(false);
      setBulkLinkSteps([]);
      setSelectedLabels(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (!db || selectedLabels.size === 0) return;
    if (!window.confirm(`선택한 ${selectedLabels.size}건의 자료를 삭제하시겠습니까?`)) return;
    setBusy(true);
    try {
      await Promise.all(
        [...selectedLabels].map((label) => {
          if (markdownLabelSet.has(label)) {
            return setDoc(doc(db!, 'docMaterials', docId(label)), { label, hidden: true, updatedAt: serverTimestamp() }, { merge: true });
          }
          return deleteDoc(doc(db!, 'docMaterials', docId(label)));
        })
      );
    } finally {
      setBusy(false);
      setSelectedLabels(new Set());
    }
  };

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

  /** Storage 폴더 내 파일을 새 경로로 복사 후 원본 삭제, 새 경로 목록 반환 */
  const moveStorageFolder = async (oldLabel: string, newLabel: string) => {
    const movedPaths: { previewPaths: string[]; samplePaths: string[] } = { previewPaths: [], samplePaths: [] };
    if (!storage) return movedPaths;
    const folders = ['checklist-previews', 'sample-downloads'] as const;

    for (const folder of folders) {
      const oldRef = ref(storage, `${folder}/${oldLabel}`);
      const result = await listAll(oldRef).catch(() => ({ items: [] as never[] }));

      for (const item of result.items) {
        const bytes = await getBytes(item);
        const newPath = `${folder}/${newLabel}/${item.name}`;
        await uploadBytes(ref(storage, newPath), bytes);
        await deleteObject(item);

        if (folder === 'checklist-previews') movedPaths.previewPaths.push(newPath);
        else movedPaths.samplePaths.push(newPath);
      }
    }
    return movedPaths;
  };

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
  }, [setForm]);

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

    try {
      if (newLabel !== oldLabel) {
        // 1. Storage 파일 이동 (복사 → 삭제)
        const movedPaths = await moveStorageFolder(oldLabel, newLabel);
        // 2. 이전 Firestore 문서 삭제
        await deleteDoc(doc(db, 'docMaterials', docId(oldLabel)));
        // 3. 새 Firestore 문서 생성 (메타데이터 포함)
        await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
          label: newLabel,
          kind: snapshot.kind,
          description: snapshot.description.trim(),
          linkedSteps: snapshot.linkedSteps,
          previewPaths: movedPaths.previewPaths,
          samplePaths: movedPaths.samplePaths,
          updatedAt: serverTimestamp(),
        });
        // 4. fileState 캐시 갱신
        setFileState((prev) => {
          const next = { ...prev };
          if (next[oldLabel]) {
            next[newLabel] = { ...next[oldLabel], loaded: false };
            delete next[oldLabel];
          }
          return next;
        });
      } else {
        // 라벨 미변경: merge로 안전하게 업데이트
        await setDoc(doc(db, 'docMaterials', docId(newLabel)), {
          label: newLabel,
          kind: snapshot.kind,
          description: snapshot.description.trim(),
          linkedSteps: snapshot.linkedSteps,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } finally {
      setBusy(false);
      setEditingLabel((cur) => (cur === oldLabel ? null : cur));
      setForm((cur) => (cur.label === newLabel ? emptyForm : cur));
    }
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
    if (!storage || !db) return;
    const folder = type === 'preview' ? 'checklist-previews' : 'sample-downloads';
    const path = `${folder}/${label}/${file.name}`;
    setUploading(`${label}-${type}`);
    try {
      await uploadBytes(ref(storage, path), file);
      // 메타데이터 기록
      const fieldKey = type === 'preview' ? 'previewPaths' : 'samplePaths';
      const docRef = doc(db, 'docMaterials', docId(label));
      await setDoc(docRef, {
        [fieldKey]: arrayUnion(path),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await loadFilesForDoc(label);
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(null);
  };

  const handleFileDelete = async (fullPath: string, label: string) => {
    if (!storage || !db) return;
    try {
      await deleteObject(ref(storage, fullPath));
      // 메타데이터에서 제거
      const isPreview = fullPath.startsWith('checklist-previews/');
      const fieldKey = isPreview ? 'previewPaths' : 'samplePaths';
      const docRef = doc(db, 'docMaterials', docId(label));
      await setDoc(docRef, {
        [fieldKey]: arrayRemove(fullPath),
        updatedAt: serverTimestamp(),
      }, { merge: true });
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

  const renderFilePanel = (label: string) => {
    const mat = fileState[label];
    const isUploadingPreview = uploading === `${label}-preview`;
    const isUploadingSample = uploading === `${label}-sample`;

    return (
      <tr className="border-b border-ln">
        <td colSpan={7} className="px-6 py-4 bg-surface-sunken">
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
                    <button onClick={() => handleFileDelete(f.fullPath, label)} className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle" title="삭제" aria-label="삭제">
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
                    <button onClick={() => handleFileDelete(f.fullPath, label)} className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle" title="삭제" aria-label="삭제">
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
      <AdminPageHeader
        title="자료 관리"
        description={`참조 문서별 미리보기·샘플 파일을 관리하고, 점검항목에 연결합니다. (${docs.length}건)`}
        action={
          <Button size="sm" onClick={startAdd}>
            <Plus size={14} className="mr-1" />
            자료 추가
          </Button>
        }
      />

      {/* Bulk action bar */}
      {selectedLabels.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-ln bg-surface-base px-3 py-2">
          <span className="text-xs font-semibold text-tx-secondary">{selectedLabels.size}건 선택</span>
          <span className="h-4 w-px bg-ln" />
          <button
            type="button"
            onClick={() => { setBulkLinkSteps([]); setBulkLinkOpen(true); }}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold text-accent-text bg-accent-subtle hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            <Link2 size={11} /> 일괄 연결
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={busy}
            className="rounded px-2 py-0.5 text-[10px] font-bold text-danger-text bg-danger-subtle hover:opacity-80 disabled:opacity-40"
          >
            일괄 삭제
          </button>
          <button type="button" onClick={() => setSelectedLabels(new Set())} className="ml-auto text-[10px] text-tx-muted hover:text-tx-secondary">
            선택 해제
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={previewInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
      <input ref={sampleInputRef} type="file" className="hidden" onChange={onFileSelected} />

      <AdminTable
        columns={[{ label: '', className: 'w-10' }, ...BASE_COLUMNS]}
        isEmpty={docs.length === 0 && !showAddForm}
        emptyMessage="등록된 자료가 없습니다."
        headerSlot={
          <th className="px-2 py-3 w-10">
            <input
              type="checkbox"
              checked={docs.length > 0 && selectedLabels.size === docs.length}
              onChange={toggleSelectAll}
              className="rounded border-ln accent-accent"
            />
          </th>
        }
      >
        {/* Add form */}
        {showAddForm && (
          <tr className="border-b border-ln bg-accent-subtle">
            <td className="px-2 py-2" />
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
            <td className="px-4 py-2">
              <StepChips mode="toggle" selected={form.linkedSteps} onToggle={toggleStep} />
            </td>
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
                <button onClick={handleAdd} disabled={busy} className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg" title="저장" aria-label="저장">
                  <Check size={16} />
                </button>
                <button onClick={() => setShowAddForm(false)} className="rounded p-1 text-tx-muted hover:bg-interactive-hover" title="취소" aria-label="취소">
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
                  <td className="px-2 py-2" />
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
                  <td className="px-4 py-2">
                    <StepChips mode="toggle" selected={form.linkedSteps} onToggle={toggleStep} />
                  </td>
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
                      <button onClick={handleEditSave} disabled={busy} className="rounded p-1 text-status-pass-text hover:bg-status-pass-bg" title="저장" aria-label="저장">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEdit} className="rounded p-1 text-tx-muted hover:bg-interactive-hover" title="취소" aria-label="취소">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && renderFilePanel(d.label)}
              </Fragment>
            );
          }

          const allSteps = Array.from(new Set([...(markdownUsageMap[d.label] ?? []), ...d.linkedSteps]));
          return (
            <Fragment key={d.label}>
              <tr className={`border-b border-ln transition-colors ${isExpanded ? 'bg-surface-raised' : 'hover:bg-interactive-hover'}`}>
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLabels.has(d.label)}
                    onChange={() => toggleSelect(d.label)}
                    className="rounded border-ln accent-accent"
                  />
                </td>
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
                <td className="px-4 py-3">
                  <StepChips mode="display" steps={allSteps} />
                </td>
                <td className="px-4 py-3 text-xs text-tx-tertiary">{d.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleEditStart(d)} className="rounded p-1 text-tx-muted hover:text-accent-text hover:bg-accent-subtle" title="수정" aria-label="수정">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(d.label)} disabled={busy} className="rounded p-1 text-tx-muted hover:text-danger-text hover:bg-danger-subtle disabled:opacity-40" title="삭제" aria-label="삭제">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
              {isExpanded && renderFilePanel(d.label)}
            </Fragment>
          );
        })}
      </AdminTable>

      <ConfirmModal
        open={!!deleteTarget}
        title="자료 삭제"
        description={
          <p>
            <strong className="text-tx-secondary">{deleteTarget}</strong> 자료를 삭제하시겠습니까?
          </p>
        }
        confirmLabel="삭제"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        busy={busy}
        icon={
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-50 dark:bg-red-500/10 shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
        }
      />

      <BusyOverlay visible={busy && !deleteTarget} />

      {/* Bulk link modal */}
      {bulkLinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-ln bg-surface-overlay shadow-2xl">
            <div className="flex items-center justify-between border-b border-ln px-5 py-4">
              <div>
                <h3 className="text-sm font-extrabold text-tx-primary">일괄 연결</h3>
                <p className="text-[11px] text-tx-tertiary mt-0.5">{selectedLabels.size}건의 자료에 점검항목을 추가합니다</p>
              </div>
              <button type="button" onClick={() => setBulkLinkOpen(false)} className="rounded-md border border-ln px-2 py-1 text-xs text-tx-tertiary hover:text-tx-secondary">
                <X size={14} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="text-[11px] font-semibold text-tx-muted">연결할 점검항목 선택</div>
              <StepChips
                mode="toggle"
                selected={bulkLinkSteps}
                onToggle={(stepId) =>
                  setBulkLinkSteps((prev) =>
                    prev.includes(stepId) ? prev.filter((s) => s !== stepId) : [...prev, stepId]
                  )
                }
              />
              {bulkLinkSteps.length === 0 && (
                <p className="text-[10px] text-tx-muted">최소 1개 이상의 항목을 선택하세요</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-ln px-5 py-3">
              <button type="button" onClick={() => setBulkLinkOpen(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover">
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleBulkLink()}
                disabled={busy || bulkLinkSteps.length === 0}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-accent-solid hover:bg-accent-hover disabled:opacity-40"
              >
                {busy ? '처리 중...' : `${bulkLinkSteps.length}개 항목 연결`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
