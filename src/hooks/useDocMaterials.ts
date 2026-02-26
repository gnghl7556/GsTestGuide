import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DocMaterial } from '../lib/content/mergeOverrides';

export function useDocMaterials() {
  const [materials, setMaterials] = useState<DocMaterial[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'docMaterials'), (snap) => {
      const result: DocMaterial[] = [];
      snap.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        if (data.hidden) return;
        result.push({
          label: (data.label as string) || '',
          kind: (data.kind as string) || 'file',
          description: (data.description as string) || '',
          linkedSteps: (data.linkedSteps as string[]) || [],
        });
      });
      setMaterials(result);
    });
    return () => unsub();
  }, []);

  return materials;
}
