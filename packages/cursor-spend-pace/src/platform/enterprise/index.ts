import type { PlatformAdapter } from '../types';
import { enterpriseTrackKind, findEnterpriseMonthlyTracks } from './tracks';
import { enterpriseUsedPct } from './usage';

export const enterpriseTeamAdapter: PlatformAdapter = {
  id: 'enterprise-team',
  findMonthlyTracks(doc = document) {
    return findEnterpriseMonthlyTracks(doc);
  },
  trackKind(track, index) {
    return enterpriseTrackKind(track, index);
  },
  usedPct(kind, snapshot) {
    return enterpriseUsedPct(kind, snapshot);
  },
};
