import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ContentSnapshot } from '../types/contentVersion';

export function useContentVersions() {
  const [versions, setVersions] = useState<Record<string, ContentSnapshot>>({});

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'contentVersions'), (snap) => {
      const result: Record<string, ContentSnapshot> = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data.content) {
          result[d.id] = data.content as ContentSnapshot;
        }
      });
      setVersions(result);
    });
    return () => unsub();
  }, []);

  return versions;
}
