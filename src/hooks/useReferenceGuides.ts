import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { REFERENCES } from 'virtual:content/references';
import type { ReferenceGuide } from 'virtual:content/references';

export type ReferenceGuideData = ReferenceGuide & { source: 'markdown' | 'firestore' };

export function useReferenceGuides(): ReferenceGuideData[] {
  const [dbGuides, setDbGuides] = useState<Record<string, ReferenceGuide>>({});

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'referenceGuides'), (snap) => {
      const result: Record<string, ReferenceGuide> = {};
      snap.forEach((d) => {
        const data = d.data();
        result[d.id] = {
          id: d.id,
          title: data.title ?? '',
          description: data.description ?? '',
          checkPoints: data.checkPoints ?? [],
          tip: data.tip ?? '',
        };
      });
      setDbGuides(result);
    });
    return () => unsub();
  }, []);

  // Merge: DB overrides markdown defaults by id, then append DB-only guides
  const mdIds = new Set(REFERENCES.map((r) => r.id));
  const merged: ReferenceGuideData[] = REFERENCES.map((r) => {
    const dbOverride = dbGuides[r.id];
    if (!dbOverride) return { ...r, source: 'markdown' as const };
    return { ...dbOverride, source: 'firestore' as const };
  });

  // Add guides that exist only in DB (newly added)
  for (const [id, guide] of Object.entries(dbGuides)) {
    if (!mdIds.has(id)) {
      merged.push({ ...guide, source: 'firestore' as const });
    }
  }

  return merged;
}
