import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ContentSnapshot } from '../types/contentVersion';
import type { ContentOverride } from '../lib/content/mergeOverrides';
import { requirementToSnapshot } from '../lib/content/snapshotUtils';
import { REQUIREMENTS_DB } from 'virtual:content/process';

/**
 * contentVersions 컬렉션을 실시간 구독하되,
 * 마이그레이션 전 레거시 contentOverrides 데이터도 폴백으로 읽는다.
 * contentVersions에 해당 reqId가 있으면 우선 사용, 없으면 contentOverrides를 변환하여 반환.
 */
export function useContentVersions() {
  const [versions, setVersions] = useState<Record<string, ContentSnapshot>>({});
  const latestVersions = useRef<Record<string, ContentSnapshot>>({});
  const latestOverrides = useRef<Record<string, ContentOverride>>({});

  useEffect(() => {
    if (!db) return;

    function merge() {
      const result: Record<string, ContentSnapshot> = { ...latestVersions.current };
      // contentVersions에 없는 reqId는 레거시 contentOverrides에서 변환
      for (const [reqId, override] of Object.entries(latestOverrides.current)) {
        if (!result[reqId]) {
          const baseReq = REQUIREMENTS_DB.find((r) => r.id === reqId);
          if (baseReq) {
            result[reqId] = requirementToSnapshot(baseReq, override);
          }
        }
      }
      setVersions(result);
    }

    const unsub1 = onSnapshot(collection(db, 'contentVersions'), (snap) => {
      const res: Record<string, ContentSnapshot> = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data.content) res[d.id] = data.content as ContentSnapshot;
      });
      latestVersions.current = res;
      merge();
    });

    const unsub2 = onSnapshot(collection(db, 'contentOverrides'), (snap) => {
      const res: Record<string, ContentOverride> = {};
      snap.forEach((d) => {
        res[d.id] = d.data() as ContentOverride;
      });
      latestOverrides.current = res;
      merge();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return versions;
}
