import type { DocEntry } from '../types/testSetup';

export const isDocEntry = (item: unknown): item is DocEntry =>
  Boolean(item && typeof item === 'object' && 'docType' in (item as Record<string, unknown>));
