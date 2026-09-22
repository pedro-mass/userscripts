import type { UsageSnapshot } from '../api';

export type PlatformId = 'pro-included' | 'enterprise-team';

export type MonthlyMeterKind = 'cursor' | 'other' | 'team';

export type GrokMeterKind = 'grok';

export type MeterKind = MonthlyMeterKind | GrokMeterKind;

export interface PlatformAdapter {
  id: PlatformId;
  findMonthlyTracks(doc?: Document): HTMLElement[];
  trackKind(track: HTMLElement, index: number): MonthlyMeterKind | null;
  usedPct(kind: MonthlyMeterKind, snapshot: UsageSnapshot): number | null;
}
