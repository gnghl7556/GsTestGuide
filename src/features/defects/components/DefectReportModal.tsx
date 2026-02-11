import { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';

interface DefectReportModalProps {
  open: boolean;
  projectId: string;
  testCaseId: string;
  onClose: () => void;
}

type EvidenceFile = { name: string; url: string };

export function DefectReportModal({ open, projectId, testCaseId, onClose }: DefectReportModalProps) {
  const [summary, setSummary] = useState('');
  const [reportVersion, setReportVersion] = useState<1 | 2 | 3 | 4>(1);
  const [isDerived, setIsDerived] = useState(false);
  const [severity, setSeverity] = useState<'H' | 'M' | 'L' | ''>('');
  const [frequency, setFrequency] = useState<'A' | 'I' | ''>('');
  const [qualityCharacteristic, setQualityCharacteristic] = useState('');
  const [accessPath, setAccessPath] = useState('');
  const [testEnvironment, setTestEnvironment] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [description, setDescription] = useState('');
  const [ttaComment, setTtaComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setSummary('');
    setReportVersion(1);
    setIsDerived(false);
    setSeverity('');
    setFrequency('');
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
        linkedTestCaseId: testCaseId,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-ln bg-surface-base shadow-xl">
        <div className="flex items-center justify-between border-b border-ln px-5 py-4">
          <div className="text-sm font-extrabold text-tx-primary">결함 보고</div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-md border border-ln px-2 py-1 text-xs font-semibold text-tx-tertiary hover:text-tx-secondary"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-xs text-tx-secondary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">요약 *</label>
              <input
                className="w-full rounded-md border border-ln px-2 py-1"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">결함 리포트 차수</label>
              <select
                className="w-full rounded-md border border-ln px-2 py-1"
                value={reportVersion}
                onChange={(e) => setReportVersion(Number(e.target.value) as 1 | 2 | 3 | 4)}
              >
                <option value={1}>1차 (초기)</option>
                <option value={2}>2차 (초기)</option>
                <option value={3}>3차 (1차 패치 후 파생/보안/성능)</option>
                <option value={4}>4차 (최종)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">시험 환경</label>
              <input
                className="w-full rounded-md border border-ln px-2 py-1"
                value={testEnvironment}
                onChange={(e) => setTestEnvironment(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                id="defect-derived"
                type="checkbox"
                checked={isDerived}
                onChange={(e) => setIsDerived(e.target.checked)}
                className="h-4 w-4 rounded border-ln-strong text-primary-700 focus:ring-primary-500"
              />
              <label htmlFor="defect-derived" className="text-[11px] text-tx-secondary">
                파생 결함 (회귀/패치 후 파생)
              </label>
            </div>
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">결함 정도 *</label>
              <select
                className="w-full rounded-md border border-ln px-2 py-1"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'H' | 'M' | 'L' | '')}
              >
                <option value="">선택</option>
                <option value="H">H</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">발생 빈도</label>
              <select
                className="w-full rounded-md border border-ln px-2 py-1"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'A' | 'I' | '')}
              >
                <option value="">선택</option>
                <option value="A">A</option>
                <option value="I">I</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">품질 특성 *</label>
              <input
                className="w-full rounded-md border border-ln px-2 py-1"
                value={qualityCharacteristic}
                onChange={(e) => setQualityCharacteristic(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-tx-tertiary mb-1">기능 접근 경로</label>
              <input
                className="w-full rounded-md border border-ln px-2 py-1"
                value={accessPath}
                onChange={(e) => setAccessPath(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-tx-tertiary mb-1">재현 절차</label>
            <textarea
              className="w-full rounded-md border border-ln px-2 py-1"
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="줄바꿈으로 구분"
            />
          </div>
          <div>
            <label className="block text-[11px] text-tx-tertiary mb-1">결함 상세 설명</label>
            <textarea
              className="w-full rounded-md border border-ln px-2 py-1"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-tx-tertiary mb-1">TTA 의견</label>
            <textarea
              className="w-full rounded-md border border-ln px-2 py-1"
              rows={2}
              value={ttaComment}
              onChange={(e) => setTtaComment(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-tx-tertiary mb-1">증빙 자료</label>
            <label className="inline-flex items-center gap-2 rounded-md border border-ln bg-surface-base px-3 py-2 text-[11px] font-semibold text-tx-secondary hover:bg-interactive-hover">
              <UploadCloud size={14} />
              파일 추가
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setEvidenceFiles(files);
                }}
              />
            </label>
            {evidenceFiles.length > 0 && (
              <div className="mt-2 text-[11px] text-tx-tertiary">
                {evidenceFiles.map((file) => file.name).join(', ')}
              </div>
            )}
          </div>
          {errorMsg && <div className="text-[11px] text-danger-text">{errorMsg}</div>}
        </div>
        <div className="border-t border-ln px-5 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
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
