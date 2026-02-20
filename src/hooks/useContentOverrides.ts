import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ContentOverride } from '../lib/content/mergeOverrides';

export function useContentOverrides() {
  const [overrides, setOverrides] = useState<Record<string, ContentOverride>>({});

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'contentOverrides'), (snap) => {
      const result: Record<string, ContentOverride> = {};
      snap.forEach((d) => {
        result[d.id] = d.data() as ContentOverride;
      });
      setOverrides(result);
    });
    return () => unsub();
  }, []);

  return overrides;
}
