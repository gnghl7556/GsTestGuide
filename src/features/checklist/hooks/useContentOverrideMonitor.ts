import { useEffect, useRef, useState } from 'react';
import type { ContentSnapshot } from '../../../types/contentVersion';

export function useContentOverrideMonitor(versionedContents: Record<string, ContentSnapshot>) {
  const [contentUpdateNotice, setContentUpdateNotice] = useState(false);
  const monitorRef = useRef(false);
  const prevFpRef = useRef('');

  useEffect(() => {
    const t = setTimeout(() => {
      monitorRef.current = true;
      prevFpRef.current = JSON.stringify(
        Object.entries(versionedContents).map(([k, v]) => [k, v.title, JSON.stringify(v.checkpoints), v.passCriteria])
      );
    }, 3000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!monitorRef.current) return;
    const fp = JSON.stringify(
      Object.entries(versionedContents).map(([k, v]) => [k, v.title, JSON.stringify(v.checkpoints), v.passCriteria])
    );
    if (fp !== prevFpRef.current) {
      setContentUpdateNotice(true);
      prevFpRef.current = fp;
    }
  }, [versionedContents]);

  const dismissNotice = () => setContentUpdateNotice(false);

  return { contentUpdateNotice, dismissNotice };
}
