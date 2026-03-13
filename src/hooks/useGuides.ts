import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GUIDES } from 'virtual:content/guides';
import type { Guide, GuideCategory, GuideWithSource } from '../types/guide';

interface UseGuidesOptions {
  category?: GuideCategory;
}

export function useGuides(options?: UseGuidesOptions): GuideWithSource[] {
  const [dbGuides, setDbGuides] = useState<Record<string, Partial<Guide>>>({});

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'referenceGuides'), (snap) => {
      const result: Record<string, Partial<Guide>> = {};
      snap.forEach((d) => {
        result[d.id] = d.data() as Partial<Guide>;
      });
      setDbGuides(result);
    });
    return () => unsub();
  }, []);

  return useMemo(() => {
    const mdIds = new Set(GUIDES.map((g) => g.id));

    let merged: GuideWithSource[] = GUIDES.map((g) => {
      const override = dbGuides[g.id];
      if (!override) return { ...g, source: 'markdown' as const };
      return { ...g, ...override, id: g.id, source: 'firestore' as const };
    });

    for (const [id, guide] of Object.entries(dbGuides)) {
      if (!mdIds.has(id)) {
        merged.push({
          id,
          title: guide.title ?? '',
          category: guide.category ?? 'reference',
          icon: guide.icon ?? '',
          description: guide.description ?? '',
          order: guide.order ?? 99,
          sections: guide.sections ?? [],
          checkPoints: guide.checkPoints,
          tip: guide.tip,
          source: 'firestore' as const,
        });
      }
    }

    if (options?.category) {
      merged = merged.filter((g) => g.category === options.category);
    }

    merged.sort((a, b) => a.order - b.order);

    return merged;
  }, [dbGuides, options?.category]);
}
