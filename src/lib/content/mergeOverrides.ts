import type { Requirement } from '../../types';

export interface ContentOverride {
  title?: string;
  description?: string;
  checkpoints?: Record<number, string>;
  updatedAt?: unknown;
  updatedBy?: string;
}

export function mergeOverrides(
  base: Requirement[],
  overrides: Record<string, ContentOverride>,
): Requirement[] {
  if (!overrides || Object.keys(overrides).length === 0) return base;

  return base.map((req) => {
    const ov = overrides[req.id];
    if (!ov) return req;

    return {
      ...req,
      ...(ov.title != null && { title: ov.title }),
      ...(ov.description != null && { description: ov.description }),
      ...(ov.checkpoints != null && req.checkPoints && {
        checkPoints: req.checkPoints.map((cp, i) =>
          ov.checkpoints![i] != null ? ov.checkpoints![i] : cp,
        ),
      }),
    };
  });
}
