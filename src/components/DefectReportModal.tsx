import { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/config';

interface DefectReportModalProps {
  open: boolean;
  projectId: string;
  testCaseId: string;
  onClose: () => void;
}

type EvidenceFile = { name: string; url: string };

export function DefectReportModal({ open, projectId, testCaseId, onClose }: DefectReportModalProps) {
  const [summary, setSummary] = useState('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="text-sm font-extrabold text-gray-900">결함 보고</div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-xs text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">요약 *</label>
              <input
                className="w-full rounded-md border border-gray-200 px-2 py-1"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">시험 환경</label>
              <input
                className="w-full rounded-md border border-gray-200 px-2 py-1"
                value={testEnvironment}
                onChange={(e) => setTestEnvironment(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">결함 정도 *</label>
              <select
                className="w-full rounded-md border border-gray-200 px-2 py-1"
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
              <label className="block text-[11px] text-gray-500 mb-1">발생 빈도</label>
              <select
                className="w-full rounded-md border border-gray-200 px-2 py-1"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'A' | 'I' | '')}
              >
                <option value="">선택</option>
                <option value="A">A</option>
                <option value="I">I</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">품질 특성 *</label>
              <input
                className="w-full rounded-md border border-gray-200 px-2 py-1"
                value={qualityCharacteristic}
                onChange={(e) => setQualityCharacteristic(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">기능 접근 경로</label>
              <input
                className="w-full rounded-md border border-gray-200 px-2 py-1"
                value={accessPath}
                onChange={(e) => setAccessPath(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">재현 절차</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-2 py-1"
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="줄바꿈으로 구분"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">결함 상세 설명</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-2 py-1"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">TTA 의견</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-2 py-1"
              rows={2}
              value={ttaComment}
              onChange={(e) => setTtaComment(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">증빙 자료</label>
            <label className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] font-semibold text-gray-600 hover:text-gray-800">
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
              <div className="mt-2 text-[11px] text-gray-500">
                {evidenceFiles.map((file) => file.name).join(', ')}
              </div>
            )}
          </div>
          {errorMsg && <div className="text-[11px] text-red-500">{errorMsg}</div>}
        </div>
        <div className="border-t border-gray-200 px-5 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-md border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            {saving ? '저장 중...' : '결함 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
