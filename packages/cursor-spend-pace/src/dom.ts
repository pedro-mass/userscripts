export type MeterKind = 'cursor' | 'other' | 'grok';

const TRACK_SELECTOR = '.relative.w-full.overflow-hidden.rounded-full';
const FILL_SELECTOR = '.absolute.inset-y-0.left-0';

export function isSpendingPage(): boolean {
  const path = dashboardPath();
  if (
    path === '/dashboard/spending' ||
    path.startsWith('/dashboard/spending/') ||
    path === '/dashboard/usage' ||
    path.startsWith('/dashboard/usage/')
  ) {
    return true;
  }
  const tab = new URLSearchParams(location.search).get('tab');
  return path === '/dashboard' && /^(spending|usage)$/i.test(tab ?? '');
}

export function dashboardPath(): string {
  const path = (location.pathname.replace(/\/+$/, '') || '/').replace(
    /^\/[a-z]{2}(?:-[A-Za-z]{2})?(?=\/|$)/,
    '',
  );
  return path;
}

function sectionRoot(el: Element | null): Element | null {
  if (!el) return null;
  return el.closest('.dashboard-section') ?? el.closest('section') ?? el.parentElement;
}

function tracksIn(section: Element | null): HTMLElement[] {
  if (!section) return [];
  const primary = Array.from(section.querySelectorAll<HTMLElement>(TRACK_SELECTOR));
  if (primary.length) return primary;
  return Array.from(section.querySelectorAll<HTMLElement>('[class*="rounded-full"]')).filter((el) =>
    Boolean(findFill(el)),
  );
}

function includedSectionRoots(): Element[] {
  const roots: Element[] = [];
  const seen = new Set<Element>();
  const add = (el: Element) => {
    const root = sectionRoot(el);
    if (!root || seen.has(root)) return;
    seen.add(root);
    roots.push(root);
  };

  document.querySelectorAll<HTMLElement>('[id]').forEach((el) => {
    if (/^included-in-/i.test(el.id)) add(el);
  });

  return roots;
}

export function findFill(track: Element): HTMLElement | null {
  return (
    track.querySelector<HTMLElement>(FILL_SELECTOR) ??
    track.querySelector<HTMLElement>('[style*="width"]')
  );
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

export function trackKind(track: Element, fallbackIndex?: number): MeterKind | null {
  const text = cardText(track);
  if (/Cursor Models/i.test(text)) return 'cursor';
  if (/Other Models/i.test(text)) return 'other';
  if (/Weekly usage/i.test(text) || /Grok Bot/i.test(text)) return 'grok';
  if (fallbackIndex === 0) return 'cursor';
  if (fallbackIndex === 1) return 'other';
  return null;
}

function uniqueTracks(tracks: HTMLElement[]): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  return tracks.filter((track) => {
    if (seen.has(track)) return false;
    seen.add(track);
    return true;
  });
}

export function monthlyTracks(): HTMLElement[] {
  const fromRoots = uniqueTracks(includedSectionRoots().flatMap((root) => tracksIn(root)));
  if (fromRoots.length) return fromRoots;
  return uniqueTracks(Array.from(document.querySelectorAll<HTMLElement>(TRACK_SELECTOR))).filter(
    (track) => trackKind(track) === 'cursor' || trackKind(track) === 'other',
  );
}

export function grokTracks(): HTMLElement[] {
  const section = document.getElementById('grok-bot');
  return uniqueTracks(tracksIn(sectionRoot(section)));
}

export function hasUsageTracks(): boolean {
  return monthlyTracks().length > 0 || grokTracks().length > 0;
}

export function parseUsedFromFill(fill: HTMLElement | null): number | null {
  const style = fill?.getAttribute('style') ?? '';
  const match = style.match(/width:\s*([\d.]+)%/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}
