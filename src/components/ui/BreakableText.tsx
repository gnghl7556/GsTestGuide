import { useMemo } from 'react';
import { insertBreakHints } from '../../utils/textBreak';

export function BreakableText({ children }: { children: string }) {
  const processed = useMemo(() => insertBreakHints(children), [children]);
  return <>{processed}</>;
}
