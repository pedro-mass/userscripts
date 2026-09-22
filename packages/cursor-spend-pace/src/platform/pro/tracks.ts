import { findFill, PRO_TRACK_SELECTOR, uniqueTracks } from '../../dom/shared';
import type { MonthlyMeterKind } from '../types';

function sectionRoot(el: Element | null): Element | null {
  if (!el) return null;
  return el.closest('.dashboard-section') ?? el.closest('section') ?? el.parentElement;
}

function tracksIn(section: Element | null): HTMLElement[] {
  if (!section) return [];
  const primary = Array.from(section.querySelectorAll<HTMLElement>(PRO_TRACK_SELECTOR));
  if (primary.length) return primary;
  return Array.from(section.querySelectorAll<HTMLElement>('[class*="rounded-full"]')).filter((el) =>
    Boolean(findFill(el)),
  );
}

function includedSectionRoots(doc: Document): Element[] {
  const roots: Element[] = [];
  const seen = new Set<Element>();
  const add = (el: Element) => {
    const root = sectionRoot(el);
    if (!root || seen.has(root)) return;
    seen.add(root);
    roots.push(root);
  };

  doc.querySelectorAll<HTMLElement>('[id]').forEach((el) => {
    if (/^included-in-/i.test(el.id)) add(el);
  });

  return roots;
}

function cardText(track: Element): string {
  let el: Element | null = track;
  for (let i = 0; i < 8 && el; i++) {
    const text = el.textContent ?? '';
    if (/Cursor Models|Other Models|Grok Bot|Weekly usage/i.test(text)) return text;
    el = el.parentElement;
  }
  const card = track.closest('.px-4.py-3') ?? track.parentElement;
  return card?.textContent ?? '';
}

export function proTrackKind(track: Element, fallbackIndex?: number): MonthlyMeterKind | 'grok' | null {
  const text = cardText(track);
  if (/Cursor Models/i.test(text)) return 'cursor';
  if (/Other Models/i.test(text)) return 'other';
  if (/Weekly usage/i.test(text) || /Grok Bot/i.test(text)) return 'grok';
  if (fallbackIndex === 0) return 'cursor';
  if (fallbackIndex === 1) return 'other';
  return null;
}

export function findProMonthlyTracks(doc: Document = document): HTMLElement[] {
  const fromRoots = uniqueTracks(includedSectionRoots(doc).flatMap((root) => tracksIn(root)));
  if (fromRoots.length) return fromRoots;
  return uniqueTracks(Array.from(doc.querySelectorAll<HTMLElement>(PRO_TRACK_SELECTOR))).filter(
    (track) => {
      const kind = proTrackKind(track);
      return kind === 'cursor' || kind === 'other';
    },
  );
}

export function findGrokTracks(doc: Document = document): HTMLElement[] {
  const byId = doc.getElementById('grok-bot');
  const fromSection = uniqueTracks(tracksIn(sectionRoot(byId)));
  if (fromSection.length) return fromSection;

  const fromLabels = uniqueTracks(
    Array.from(doc.querySelectorAll<HTMLElement>(PRO_TRACK_SELECTOR)).filter(
      (track) => proTrackKind(track) === 'grok',
    ),
  );
  if (fromLabels.length) return fromLabels;

  const grokHeading = Array.from(doc.querySelectorAll<HTMLElement>('h1,h2,h3,h4,button')).find(
    (el) => /Grok Bot/i.test(el.textContent ?? ''),
  );
  return uniqueTracks(tracksIn(sectionRoot(grokHeading ?? null)));
}

/** Exported for DOM heuristics when API is unavailable. */
export function proTracksVisible(doc: Document = document): boolean {
  return findProMonthlyTracks(doc).length > 0 || includedSectionRoots(doc).length > 0;
}
