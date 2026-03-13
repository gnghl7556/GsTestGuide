import { useEffect, useRef, useState } from 'react';
import type { ContentOverride } from '../../../lib/content/mergeOverrides';

export function useContentOverrideMonitor(contentOverrides: Record<string, ContentOverride>) {
  const [contentUpdateNotice, setContentUpdateNotice] = useState(false);
  const overrideMonitorRef = useRef(false);
  const prevOverrideFpRef = useRef('');

  useEffect(() => {
    const t = setTimeout(() => {
      overrideMonitorRef.current = true;
      prevOverrideFpRef.current = JSON.stringify(
        Object.entries(contentOverrides).map(([k, v]) => [k, v.title, JSON.stringify(v.checkpoints), v.passCriteria])
      );
    }, 3000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!overrideMonitorRef.current) return;
    const fp = JSON.stringify(
      Object.entries(contentOverrides).map(([k, v]) => [k, v.title, JSON.stringify(v.checkpoints), v.passCriteria])
    );
    if (fp !== prevOverrideFpRef.current) {
      setContentUpdateNotice(true);
      prevOverrideFpRef.current = fp;
    }
  }, [contentOverrides]);

  const dismissNotice = () => setContentUpdateNotice(false);

  return { contentUpdateNotice, dismissNotice };
}
