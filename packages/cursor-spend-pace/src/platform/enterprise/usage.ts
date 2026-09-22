import type { UsageSnapshot } from '../../api';
import type { MonthlyMeterKind } from '../types';

export function enterpriseUsedPct(kind: MonthlyMeterKind, snapshot: UsageSnapshot): number | null {
  if (kind !== 'team') return null;
  return snapshot.enterprise?.overallUsedPct ?? null;
}
