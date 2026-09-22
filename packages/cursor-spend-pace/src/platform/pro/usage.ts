import type { UsageSnapshot } from '../../api';
import type { MonthlyMeterKind } from '../types';

export function proUsedPct(kind: MonthlyMeterKind, snapshot: UsageSnapshot): number | null {
  if (kind === 'team') return null;
  if (kind === 'cursor') return snapshot.pro?.cursorUsedPct ?? null;
  if (kind === 'other') return snapshot.pro?.otherUsedPct ?? null;
  return null;
}
