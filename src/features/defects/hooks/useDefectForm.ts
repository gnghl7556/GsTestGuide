import { useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { functions, storage } from '../../../lib/firebase';

export type DefectFormState = {
  summary: string;
  reportVersion: 1 | 2 | 3 | 4;
  testEnvironment: 'ALL_OS' | 'NONE';
  severity: 'H' | 'M' | 'L';
  frequency: 'A' | 'I';
  qualityCharacteristic: string;
  accessPath: string;
  stepsToReproduce: string;
  description: string;
  ttaComment: string;
  evidenceFiles: File[];
};

const createInitialState = (): DefectFormState => ({
  summary: '',
  reportVersion: 1,
  testEnvironment: 'ALL_OS',
  severity: 'M',
  frequency: 'A',
  qualityCharacteristic: '기능적합성',
  accessPath: '',
  stepsToReproduce: '',
  description: '',
  ttaComment: '',
  evidenceFiles: []
});

type SaveDefectCallableInput = {
  projectId: string;
  testCaseId: string;
  reportVersion: 1 | 2 | 3 | 4;
  isDerived: boolean;
  summary: string;
  testEnvironment: string;
  severity: 'H' | 'M' | 'L';
  frequency: 'A' | 'I';
  qualityCharacteristic: string;
  accessPath: string;
  stepsToReproduce: string[];
  description: string;
  ttaComment: string;
  evidenceFiles: Array<{ name: string; url: string }>;
};

export const useDefectForm = (projectId: string, testCaseId: string, isFinalized: boolean = false) => {
  const [state, setState] = useState<DefectFormState>(createInitialState());
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const reset = () => {
    setState(createInitialState());
    setErrorMsg(null);
  };

  const update = <K extends keyof DefectFormState>(key: K, value: DefectFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!projectId || !functions) return false;
    if (isFinalized) {
      setErrorMsg('4차 확정 이후에는 결함을 등록/수정할 수 없습니다.');
      return false;
    }
    if (!state.summary.trim() || !state.qualityCharacteristic.trim()) {
      setErrorMsg('요약, 결함정도, 품질특성은 필수입니다.');
      return false;
    }
    setSaving(true);
    try {
      const evidenceMeta: Array<{ name: string; url: string }> = [];
      if (storage && state.evidenceFiles.length > 0) {
        for (const file of state.evidenceFiles) {
          const storagePath = `defects/${projectId}/${testCaseId}/${Date.now()}-${file.name}`;
          const fileRef = ref(storage, storagePath);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          evidenceMeta.push({ name: file.name, url });
        }
      }
      const callable = httpsCallable<SaveDefectCallableInput, { defectId: string }>(functions, 'saveDefectReport');
      await callable({
        projectId,
        testCaseId,
        reportVersion: state.reportVersion,
        isDerived: state.reportVersion >= 3,
        summary: state.summary.trim(),
        testEnvironment: state.testEnvironment,
        severity: state.severity,
        frequency: state.frequency,
        qualityCharacteristic: state.qualityCharacteristic.trim(),
        accessPath: state.accessPath.trim(),
        stepsToReproduce: state.stepsToReproduce.split('\n').map((s) => s.trim()).filter(Boolean),
        description: state.description.trim(),
        ttaComment: state.ttaComment.trim(),
        evidenceFiles: evidenceMeta
      });
      reset();
      return true;
    } catch (error) {
      console.warn('[Defects] 저장 실패:', error);
      setErrorMsg('저장에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { state, update, save, reset, saving, errorMsg };
};
