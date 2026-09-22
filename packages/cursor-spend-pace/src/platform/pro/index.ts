import type { PlatformAdapter } from '../types';
import { findProMonthlyTracks, proTrackKind } from './tracks';
import { proUsedPct } from './usage';

export const proIncludedAdapter: PlatformAdapter = {
  id: 'pro-included',
  findMonthlyTracks(doc = document) {
    return findProMonthlyTracks(doc);
  },
  trackKind(track, index) {
    const kind = proTrackKind(track, index);
    if (kind === 'cursor' || kind === 'other') return kind;
    return null;
  },
  usedPct(kind, snapshot) {
    return proUsedPct(kind, snapshot);
  },
};
