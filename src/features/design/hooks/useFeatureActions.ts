import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../../../lib/firebase';
import { useTestSetupContext } from '../../../providers/useTestSetupContext';

type DraftResponse = {
  features: Array<{
    category1?: string;
    category2?: string;
    category3?: string;
    category4?: string;
    description?: string;
  }>;
  message?: string;
};

export type FeatureItem = {
  id: string;
  category1: string;
  category2: string;
  category3: string;
  category4?: string;
  description: string;
  version?: number;
  changeType?: string;
};

export function useFeatureActions() {
  const { currentTestNumber } = useTestSetupContext();
  const projectId = currentTestNumber;

  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'uploading' | 'generating' | 'done' | 'error'>('idle');
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !projectId) return;
    const dbRef = db;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(dbRef, 'projects', projectId, 'features'));
        const next = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<FeatureItem, 'id'>;
          return {
            id: docSnap.id,
            category1: data.category1 || '',
            category2: data.category2 || '',
            category3: data.category3 || '',
            category4: data.category4 || '',
            description: data.description || '',
            version: data.version,
            changeType: data.changeType
          };
        });
        if (alive) setFeatures(next);
      } catch (error) {
        console.warn('[Features] 불러오기 실패:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [projectId]);

  const addFeature = (input: Omit<FeatureItem, 'id'>) => {
    setFeatures((prev) => [
      ...prev,
      {
        ...input,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category4: input.category4?.trim() || ''
      }
    ]);
  };

  const updateFeature = (next: FeatureItem) => {
    setFeatures((prev) => prev.map((item) => (item.id === next.id ? { ...next } : item)));
  };

  const deleteFeature = (id: string) => {
    setFeatures((prev) => prev.filter((item) => item.id !== id));
  };

  const saveFeatures = async () => {
    if (!db || !projectId) return;
    const dbRef = db;
    setSaving(true);
    try {
      const batch = writeBatch(dbRef);
      const featureCol = collection(dbRef, 'projects', projectId, 'features');
      const existing = await getDocs(featureCol);
      existing.forEach((docSnap) => batch.delete(docSnap.ref));
      features.forEach((feature, index) => {
        const featureId = feature.id.startsWith('local-')
          ? `feature-${Date.now()}-${index}`
          : feature.id;
        const payload = {
          featureId,
          category1: feature.category1,
          category2: feature.category2,
          category3: feature.category3,
          category4: feature.category4 || '',
          description: feature.description,
          version: feature.version ?? 1,
          changeType: feature.changeType || ''
        };
        batch.set(doc(featureCol, featureId), payload);
      });
      await batch.commit();
    } catch (error) {
      console.warn('[Features] 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateAiDraft = async (file: File) => {
    if (!storage || !functions || !projectId) return;
    setAiStatus('uploading');
    setAiMessage(null);
    try {
      const storagePath = `feature-drafts/${projectId}/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      setAiStatus('generating');
      const callable = httpsCallable(functions, 'generateFeatureDraft');
      const response = (await callable({ storagePath, projectId })) as { data: DraftResponse };
      const draft = response.data?.features || [];
      const normalized: FeatureItem[] = draft.map((item, index) => ({
        id: `ai-${Date.now()}-${index}`,
        category1: item.category1 || '미분류',
        category2: item.category2 || '미분류',
        category3: item.category3 || '미분류',
        category4: item.category4 || '',
        description: item.description || '',
        version: 1,
        changeType: ''
      }));
      if (normalized.length > 0) {
        setFeatures(normalized);
        setAiMessage(response.data?.message || 'AI 초안이 적용되었습니다.');
      } else {
        setAiMessage('AI 초안이 비어 있습니다. PDF 내용을 확인해주세요.');
      }
      setAiStatus('done');
    } catch (error) {
      console.warn('[Features] AI 초안 생성 실패:', error);
      setAiStatus('error');
      setAiMessage('AI 초안 생성에 실패했습니다.');
    }
  };

  return useMemo(
    () => ({
      features,
      loading,
      saving,
      aiStatus,
      aiMessage,
      addFeature,
      updateFeature,
      deleteFeature,
      saveFeatures,
      generateAiDraft
    }),
    [features, loading, saving, aiStatus, aiMessage]
  );
}
