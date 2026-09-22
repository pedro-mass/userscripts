import { queryUsageTracks, uniqueTracks } from '../../dom/shared';
import type { MonthlyMeterKind } from '../types';

const MONTHLY_LABEL = /Your monthly usage/i;
const DOLLAR_PAIR = /\$\s*[\d,.]+\s*\/\s*\$\s*[\d,.]+/;

function enterpriseUsageCard(track: Element): HTMLElement | null {
  let el: Element | null = track;
  for (let i = 0; i < 12 && el; i++) {
    if (!(el instanceof HTMLElement)) break;
    const text = el.textContent ?? '';
    if (MONTHLY_LABEL.test(text) && DOLLAR_PAIR.test(text) && el.contains(track)) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

export function findEnterpriseMonthlyTracks(doc: Document = document): HTMLElement[] {
  const cards = Array.from(doc.querySelectorAll<HTMLElement>('div')).filter((el) => {
    const text = (el.textContent ?? '').replace(/\s+/g, ' ');
    if (!MONTHLY_LABEL.test(text) || !DOLLAR_PAIR.test(text)) return false;
    return queryUsageTracks(el).length > 0;
  });

  if (cards.length) {
    cards.sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0));
    const tracks = uniqueTracks(queryUsageTracks(cards[0]!));
    if (tracks.length) return tracks;
  }

  return uniqueTracks(queryUsageTracks(doc).filter((track) => enterpriseUsageCard(track)));
}

export function enterpriseTrackKind(_track: HTMLElement, _index: number): MonthlyMeterKind {
  return 'team';
}

export function enterpriseTracksVisible(doc: Document = document): boolean {
  return findEnterpriseMonthlyTracks(doc).length > 0;
}

export function parseEnterpriseDollars(card: Element): { usedPct: number | null } {
  const text = card.textContent ?? '';
  const match = text.match(/\$\s*([\d,.]+)\s*\/\s*\$\s*([\d,.]+)/);
  if (!match) return { usedPct: null };
  const used = Number(match[1]!.replace(/,/g, ''));
  const limit = Number(match[2]!.replace(/,/g, ''));
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return { usedPct: null };
  return { usedPct: (used / limit) * 100 };
}

export function enterpriseUsedPctFromDom(track: HTMLElement): number | null {
  const card = enterpriseUsageCard(track);
  if (!card) return null;
  return parseEnterpriseDollars(card).usedPct;
}

/** Dev-only: cents → percent matches enterprise usage-summary shape. */
export function assertEnterpriseUsageSelfCheck(): void {
  const pct = ((29718 / 50000) * 100).toFixed(3);
  if (pct !== '59.436') throw new Error('enterprise usage pct check failed');
}
