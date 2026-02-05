import { useState } from 'react';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';

export type DefectFormState = {
  summary: string;
  reportVersion: 1 | 2 | 3 | 4;
  testEnvironment: 'ALL_OS' | 'NONE';
  severity: 'H' | 'M' | 'L';
  frequency: 'A' | 'I';
  qualityCharacteristic: string;
  accessPath: string;
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
  description: '',
  ttaComment: '',
  evidenceFiles: []
});

export const useDefectForm = (projectId: string, testCaseId: string) => {
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
    if (!db || !projectId) return false;
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
      const defectRef = await addDoc(collection(db, 'projects', projectId, 'defects'), {
        defectId: '',
        linkedTestCaseId: testCaseId,
        reportVersion: state.reportVersion,
        isDerived: false,
        summary: state.summary.trim(),
        testEnvironment: state.testEnvironment,
        severity: state.severity,
        frequency: state.frequency,
        qualityCharacteristic: state.qualityCharacteristic.trim(),
        accessPath: state.accessPath.trim(),
        stepsToReproduce: [],
        description: state.description.trim(),
        ttaComment: state.ttaComment.trim(),
        status: '신규',
        evidenceFiles: evidenceMeta,
        reportedAt: serverTimestamp()
      });
      await setDoc(doc(db, 'projects', projectId, 'defects', defectRef.id), { defectId: defectRef.id }, { merge: true });
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
