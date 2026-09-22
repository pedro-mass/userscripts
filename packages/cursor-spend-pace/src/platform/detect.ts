import type { UsageSnapshot } from '../api';
import { enterpriseTracksVisible } from './enterprise/tracks';
import { enterpriseTeamAdapter } from './enterprise';
import { proIncludedAdapter } from './pro';
import { proTracksVisible } from './pro/tracks';
import type { PlatformAdapter, PlatformId } from './types';

export function platformFromSnapshot(summary: Pick<UsageSnapshot, 'platform'>): PlatformId {
  return summary.platform;
}

export function detectPlatform(
  snapshot: UsageSnapshot | null,
  doc: Document = document,
): PlatformAdapter {
  if (snapshot?.platform === 'enterprise-team') return enterpriseTeamAdapter;
  if (snapshot?.platform === 'pro-included') return proIncludedAdapter;

  if (enterpriseTracksVisible(doc) && !proTracksVisible(doc)) return enterpriseTeamAdapter;
  if (proTracksVisible(doc)) return proIncludedAdapter;
  if (enterpriseTracksVisible(doc)) return enterpriseTeamAdapter;

  return proIncludedAdapter;
}
