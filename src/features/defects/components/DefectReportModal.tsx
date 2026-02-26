import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { DefectFormFields } from './DefectFormFields';

export interface DefectContext {
  qualityCharacteristic?: string;
  linkedTestCaseId?: string;
  accessPath?: string;
}

interface DefectReportModalProps {
  open: boolean;
  projectId: string;
  testCaseId: string;
  onClose: () => void;
  initialContext?: DefectContext;
}

type EvidenceFile = { name: string; url: string };

export function DefectReportModal({ open, projectId, testCaseId, onClose, initialContext }: DefectReportModalProps) {
  const [summary, setSummary] = useState('');
  const [reportVersion, setReportVersion] = useState<1 | 2 | 3 | 4>(1);
  const [isDerived, setIsDerived] = useState(false);
  const [severity, setSeverity] = useState<'H' | 'M' | 'L' | ''>('M');
  const [frequency, setFrequency] = useState<'A' | 'I' | ''>('A');
  const [qualityCharacteristic, setQualityCharacteristic] = useState('');
  const [accessPath, setAccessPath] = useState('');
  const [testEnvironment, setTestEnvironment] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [description, setDescription] = useState('');
  const [ttaComment, setTtaComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 컨텍스트 자동 채움 (모달 열릴 때)
  useEffect(() => {
    if (open && initialContext) {
      if (initialContext.qualityCharacteristic) {
        setQualityCharacteristic(initialContext.qualityCharacteristic);
      }
      if (initialContext.accessPath) {
        setAccessPath(initialContext.accessPath);
      }
    }
  }, [open, initialContext]);

  const resetForm = () => {
    setSummary('');
    setReportVersion(1);
    setIsDerived(false);
    setSeverity('M');
    setFrequency('A');
    setQualityCharacteristic('');
    setAccessPath('');
    setTestEnvironment('');
    setStepsToReproduce('');
    setDescription('');
    setTtaComment('');
    setEvidenceFiles([]);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (!db || !projectId) return;
    if (!summary.trim() || !severity || !qualityCharacteristic.trim()) {
      setErrorMsg('요약, 결함정도, 품질특성은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const evidenceMeta: EvidenceFile[] = [];
      if (storage && evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const storagePath = `defects/${projectId}/${testCaseId}/${Date.now()}-${file.name}`;
          const fileRef = ref(storage, storagePath);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          evidenceMeta.push({ name: file.name, url });
        }
      }
      const defectRef = await addDoc(collection(db, 'projects', projectId, 'defects'), {
        defectId: '',
        linkedTestCaseId: initialContext?.linkedTestCaseId || testCaseId,
        reportVersion,
        isDerived,
        summary: summary.trim(),
        testEnvironment: testEnvironment.trim(),
        severity,
        frequency,
        qualityCharacteristic: qualityCharacteristic.trim(),
        accessPath: accessPath.trim(),
        stepsToReproduce: stepsToReproduce
          .split('\n')
          .map((step) => step.trim())
          .filter(Boolean),
        description: description.trim(),
        ttaComment: ttaComment.trim(),
        status: '신규',
        evidenceFiles: evidenceMeta,
        reportedAt: serverTimestamp()
      });
      await setDoc(
        doc(db, 'projects', projectId, 'defects', defectRef.id),
        { defectId: defectRef.id },
        { merge: true }
      );
      resetForm();
      onClose();
    } catch (error) {
      console.warn('[Defects] 저장 실패:', error);
      setErrorMsg('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const formValues = {
    summary,
    severity,
    frequency,
    qualityCharacteristic,
    accessPath,
    testEnvironment,
    stepsToReproduce,
    description,
    ttaComment
  };

  const handleFieldChange = <K extends keyof typeof formValues>(key: K, value: (typeof formValues)[K]) => {
    const setters: Record<string, (v: string) => void> = {
      summary: setSummary,
      qualityCharacteristic: setQualityCharacteristic,
      accessPath: setAccessPath,
      testEnvironment: setTestEnvironment,
      stepsToReproduce: setStepsToReproduce,
      description: setDescription,
      ttaComment: setTtaComment
    };
    if (key === 'severity') setSeverity(value as 'H' | 'M' | 'L' | '');
    else if (key === 'frequency') setFrequency(value as 'A' | 'I' | '');
    else setters[key]?.(value as string);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-ln bg-surface-base shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4 shrink-0">
          <div className="text-sm font-extrabold text-tx-primary">결함 보고</div>
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-xs text-tx-secondary">
          {/* 차수/파생 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">결함 리포트 차수</label>
              <select
                className="w-full rounded-md border border-ln px-2 py-1 bg-input-bg text-input-text"
                value={reportVersion}
                onChange={(e) => setReportVersion(Number(e.target.value) as 1 | 2 | 3 | 4)}
              >
                <option value={1}>1차 (초기)</option>
                <option value={2}>2차 (초기)</option>
                <option value={3}>3차 (1차 패치 후 파생/보안/성능)</option>
                <option value={4}>4차 (최종)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                id="defect-derived"
                type="checkbox"
                checked={isDerived}
                onChange={(e) => setIsDerived(e.target.checked)}
                className="h-4 w-4 rounded border-ln-strong"
              />
              <label htmlFor="defect-derived" className="text-[11px] text-tx-secondary">
                파생 결함
              </label>
            </div>
          </div>

          <DefectFormFields
            values={formValues}
            onChange={handleFieldChange}
            onFilesChange={setEvidenceFiles}
            fileNames={evidenceFiles.map((f) => f.name)}
            disabled={saving}
            compact
          />

          {errorMsg && <div className="text-[11px] text-danger-text">{errorMsg}</div>}
        </div>
        <div className="border-t border-ln px-5 py-4 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="rounded-md border border-ln px-4 py-2 text-xs font-semibold text-tx-secondary hover:bg-interactive-hover"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white"
          >
            {saving ? '저장 중...' : '결함 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
