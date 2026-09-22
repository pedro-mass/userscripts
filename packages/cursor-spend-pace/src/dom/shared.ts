export const FILL_SELECTOR = '.absolute.inset-y-0.left-0';

/** Pro spending tab bars (legacy). */
export const PRO_TRACK_SELECTOR = '.relative.w-full.overflow-hidden.rounded-full';

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

export function findFill(track: Element): HTMLElement | null {
  return (
    track.querySelector<HTMLElement>(FILL_SELECTOR) ??
    track.querySelector<HTMLElement>('[style*="width"]')
  );
}

export function parseUsedFromFill(fill: HTMLElement | null): number | null {
  const style = fill?.getAttribute('style') ?? '';
  const match = style.match(/width:\s*([\d.]+)%/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/** Pro rounded-full bars or enterprise dashboard usage accent bars. */
export function isUsageTrack(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (!el.classList.contains('relative')) return false;
  if (!el.classList.contains('w-full')) return false;
  if (!el.classList.contains('overflow-hidden')) return false;

  const fill = findFill(el);
  if (!fill || parseUsedFromFill(fill) == null) return false;

  if (el.classList.contains('rounded-full')) return true;
  if (el.className.includes('color-dashboard-usage-accent')) return true;
  return false;
}

export function queryUsageTracks(root: ParentNode = document): HTMLElement[] {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>('.relative.w-full.overflow-hidden'));
  return candidates.filter(isUsageTrack);
}

export function uniqueTracks(tracks: HTMLElement[]): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  return tracks.filter((track) => {
    if (seen.has(track)) return false;
    seen.add(track);
    return true;
  });
}

/** Selector list for teardown inside pace wrap (see render.ts). */
export const TRACK_IN_WRAP_SELECTOR =
  '.relative.w-full.overflow-hidden.rounded-full, .relative.w-full.overflow-hidden[class*="color-dashboard-usage-accent"]';
