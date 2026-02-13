import { useState, useEffect, useMemo, useRef } from 'react';
import { Upload, Trash2, Image, FileDown, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { REQUIREMENTS_DB } from 'virtual:content/process';
import { storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import type { RequiredDoc } from '../../../types';

type FileInfo = {
  name: string;
  url: string;
  fullPath: string;
};

type DocMaterialState = {
  previewFiles: FileInfo[];
  sampleFiles: FileInfo[];
};

const CATEGORY_LABELS: Record<string, string> = {
  SETUP: '시험준비',
  EXECUTION: '시험수행',
  COMPLETION: '시험종료',
};

export function MaterialManagement() {
  const [materials, setMaterials] = useState<Record<string, DocMaterialState>>({});
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());
  const previewInputRef = useRef<HTMLInputElement>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<{ label: string; type: 'preview' | 'sample' } | null>(null);

  // Collect all unique ref docs from all requirements
  const allDocs = useMemo(() => {
    const docs: Array<{ stepId: string; stepTitle: string; category: string; doc: RequiredDoc }> = [];
    for (const req of REQUIREMENTS_DB) {
      if (!req.requiredDocs) continue;
      for (const d of req.requiredDocs) {
        docs.push({ stepId: req.id, stepTitle: req.title, category: req.category, doc: d });
      }
    }
    return docs;
  }, []);

  // Group by category then step
  const grouped = useMemo(() => {
    const groups: Record<string, Record<string, typeof allDocs>> = {};
    for (const entry of allDocs) {
      if (!groups[entry.category]) groups[entry.category] = {};
      if (!groups[entry.category][entry.stepId]) groups[entry.category][entry.stepId] = [];
      groups[entry.category][entry.stepId].push(entry);
    }
    return groups;
  }, [allDocs]);

  const loadMaterialsForDoc = async (label: string) => {
    if (!storage) return;
    setLoadingDocs((prev) => new Set([...prev, label]));
    try {
      const [previewResult, sampleResult] = await Promise.all([
        listAll(ref(storage, `checklist-previews/${label}`)).catch(() => ({ items: [] })),
        listAll(ref(storage, `sample-downloads/${label}`)).catch(() => ({ items: [] })),
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

      setMaterials((prev) => ({
        ...prev,
        [label]: { previewFiles, sampleFiles },
      }));
    } catch (e) {
      console.error('Failed to load materials for', label, e);
    }
    setLoadingDocs((prev) => {
      const next = new Set(prev);
      next.delete(label);
      return next;
    });
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
        // Load materials for all docs in this step
        const stepDocs = allDocs.filter((d) => d.stepId === stepId);
        for (const d of stepDocs) {
          if (!materials[d.doc.label]) {
            void loadMaterialsForDoc(d.doc.label);
          }
        }
      }
      return next;
    });
  };

  const handleUpload = async (file: File, label: string, type: 'preview' | 'sample') => {
    if (!storage) return;
    const folder = type === 'preview' ? 'checklist-previews' : 'sample-downloads';
    const path = `${folder}/${label}/${file.name}`;
    setUploading(`${label}-${type}`);
    try {
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      await loadMaterialsForDoc(label);
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(null);
  };

  const handleDelete = async (fullPath: string, label: string) => {
    if (!storage) return;
    try {
      await deleteObject(ref(storage, fullPath));
      await loadMaterialsForDoc(label);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const triggerUpload = (label: string, type: 'preview' | 'sample') => {
    setActiveUpload({ label, type });
    if (type === 'preview') {
      previewInputRef.current?.click();
    } else {
      sampleInputRef.current?.click();
    }
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUpload) {
      void handleUpload(file, activeUpload.label, activeUpload.type);
    }
    e.target.value = '';
    setActiveUpload(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-tx-primary">자료 관리</h1>
        <p className="text-xs text-tx-tertiary mt-1">
          참조 문서별 미리보기 이미지 및 샘플 파일을 관리합니다. Firebase Storage에 저장됩니다.
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={previewInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
      />
      <input
        ref={sampleInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="space-y-4">
        {(['SETUP', 'EXECUTION', 'COMPLETION'] as const).map((cat) => {
          const steps = grouped[cat];
          if (!steps) return null;
          return (
            <div key={cat}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-tx-muted mb-2 px-1">
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="space-y-1.5">
                {Object.entries(steps).map(([stepId, docs]) => {
                  const isExpanded = expandedSteps.has(stepId);
                  const step = REQUIREMENTS_DB.find((r) => r.id === stepId);
                  return (
                    <div
                      key={stepId}
                      className="rounded-xl border border-ln bg-surface-base overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleStep(stepId)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-raised transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-tx-muted shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-tx-muted shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono font-bold text-tx-muted mr-2">
                            {stepId}
                          </span>
                          <span className="text-sm font-semibold text-tx-primary">
                            {step?.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-tx-muted bg-surface-sunken px-2 py-0.5 rounded-full">
                          {docs.length}건
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-ln px-4 py-3 bg-surface-sunken space-y-3">
                          {docs.map(({ doc }) => {
                            const mat = materials[doc.label];
                            const isLoading = loadingDocs.has(doc.label);
                            const isUploadingPreview = uploading === `${doc.label}-preview`;
                            const isUploadingSample = uploading === `${doc.label}-sample`;

                            return (
                              <div
                                key={doc.label}
                                className="rounded-lg border border-ln bg-surface-base p-3"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    doc.kind === 'external'
                                      ? 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                  }`}>
                                    {doc.kind === 'external' ? 'External' : 'File'}
                                  </span>
                                  <span className="text-sm font-bold text-tx-primary">
                                    {doc.label}
                                  </span>
                                  {doc.description && (
                                    <span className="text-[10px] text-tx-muted ml-auto">
                                      {doc.description}
                                    </span>
                                  )}
                                </div>

                                {isLoading ? (
                                  <div className="flex items-center gap-2 text-xs text-tx-muted py-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    로딩 중...
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Preview Image */}
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold text-tx-muted uppercase tracking-wide flex items-center gap-1">
                                        <Image size={10} />
                                        미리보기 이미지
                                      </div>
                                      {mat?.previewFiles.map((f) => (
                                        <div
                                          key={f.fullPath}
                                          className="flex items-center gap-2 text-xs bg-surface-sunken rounded px-2 py-1.5 border border-ln"
                                        >
                                          <img
                                            src={f.url}
                                            alt={f.name}
                                            className="h-8 w-8 rounded object-cover border border-ln"
                                          />
                                          <span className="flex-1 truncate text-tx-secondary">
                                            {f.name}
                                          </span>
                                          <button
                                            onClick={() =>
                                              handleDelete(f.fullPath, doc.label)
                                            }
                                            className="rounded p-0.5 text-tx-muted hover:text-danger-text"
                                            title="삭제"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          triggerUpload(doc.label, 'preview')
                                        }
                                        disabled={isUploadingPreview}
                                        className="flex items-center gap-1 text-[10px] font-semibold text-accent-text hover:text-accent-hover disabled:opacity-50"
                                      >
                                        {isUploadingPreview ? (
                                          <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                          <Upload size={11} />
                                        )}
                                        이미지 업로드
                                      </button>
                                    </div>

                                    {/* Sample File */}
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold text-tx-muted uppercase tracking-wide flex items-center gap-1">
                                        <FileDown size={10} />
                                        샘플 파일
                                      </div>
                                      {mat?.sampleFiles.map((f) => (
                                        <div
                                          key={f.fullPath}
                                          className="flex items-center gap-2 text-xs bg-surface-sunken rounded px-2 py-1.5 border border-ln"
                                        >
                                          <FileDown
                                            size={14}
                                            className="text-tx-muted shrink-0"
                                          />
                                          <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 truncate text-accent-text hover:text-accent-hover underline"
                                          >
                                            {f.name}
                                          </a>
                                          <button
                                            onClick={() =>
                                              handleDelete(f.fullPath, doc.label)
                                            }
                                            className="rounded p-0.5 text-tx-muted hover:text-danger-text"
                                            title="삭제"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          triggerUpload(doc.label, 'sample')
                                        }
                                        disabled={isUploadingSample}
                                        className="flex items-center gap-1 text-[10px] font-semibold text-accent-text hover:text-accent-hover disabled:opacity-50"
                                      >
                                        {isUploadingSample ? (
                                          <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                          <Upload size={11} />
                                        )}
                                        파일 업로드
                                      </button>
                                    </div>
                                  </div>
                                )}
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
        })}
      </div>
    </div>
  );
}
