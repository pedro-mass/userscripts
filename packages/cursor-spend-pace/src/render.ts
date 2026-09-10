import type { PaceCadence, PaceStatus } from './pacing';
import { formatPercent, statusLabel } from './pacing';
import { findFill, parseUsedFromFill } from './dom';

const STYLE_ID = 'pm-cursor-pace-style';
const WRAP_CLASS = 'pm-pace-wrap';
const MARKER_CLASS = 'pm-pace-marker';
const LABEL_CLASS = 'pm-pace-label';
const META_CLASS = 'pm-pace-meta';

const COLOR_AHEAD = '#ca8a04';
const COLOR_UNDER = '#16a34a';
const COLOR_ON = '#64748b';
const COLOR_MARKER = '#0f172a';
const COLOR_ACCENT = '#0284c7';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${WRAP_CLASS} { position: relative; overflow: visible; }
    .${WRAP_CLASS} .${MARKER_CLASS} {
      position: absolute;
      top: -4px;
      height: calc(100% + 4px);
      width: 2px;
      margin-left: -1px;
      background: ${COLOR_MARKER};
      box-shadow: 0 0 0 1px #fff, 0 0 0 2px ${COLOR_ACCENT};
      border-radius: 1px;
      z-index: 3;
      pointer-events: none;
    }
    .${WRAP_CLASS} .${LABEL_CLASS} {
      position: absolute;
      top: calc(100% + 6px);
      z-index: 3;
      pointer-events: none;
      font: 11px/1.2 ui-sans-serif, system-ui, sans-serif;
      font-weight: 600;
      color: ${COLOR_ACCENT};
      white-space: nowrap;
      transform: translateX(-50%);
    }
    .${META_CLASS} {
      margin-top: 22px;
      font: 11px/1.35 ui-sans-serif, system-ui, sans-serif;
      color: ${COLOR_ON};
    }
  `;
  (document.head ?? document.documentElement).appendChild(style);
}

function wrapTrack(track: HTMLElement): HTMLElement {
  const parent = track.parentElement;
  if (parent?.classList.contains(WRAP_CLASS)) return parent;
  const wrap = document.createElement('div');
  wrap.className = WRAP_CLASS;
  track.before(wrap);
  wrap.appendChild(track);
  return wrap;
}

function statusColor(status: PaceStatus): string {
  const delta = status.deltaPct;
  if (delta == null) return COLOR_ON;
  if (status.usedPct >= 100) return COLOR_AHEAD;
  if (delta > 0.5) return COLOR_AHEAD;
  if (delta < -0.5) return COLOR_UNDER;
  return COLOR_ON;
}

export function applyPace(
  track: HTMLElement,
  status: PaceStatus,
  cadence: PaceCadence = 'monthly',
): void {
  ensureStyle();
  const fill = findFill(track);
  if (!fill) return;

  const wrap = wrapTrack(track);
  const elapsed = status.elapsedPct;
  const showPace = elapsed != null && status.usedPct < 100;
  const signature = [
    status.usedPct.toFixed(4),
    elapsed == null ? '' : elapsed.toFixed(4),
    statusLabel(status, cadence),
    cadence,
  ].join('|');

  if (wrap.dataset.pmSig === signature) return;
  wrap.dataset.pmSig = signature;

  wrap.querySelector(`.${MARKER_CLASS}`)?.remove();
  wrap.querySelector(`.${LABEL_CLASS}`)?.remove();
  const next = wrap.nextElementSibling;
  if (next?.classList.contains(META_CLASS)) next.remove();

  if (showPace && elapsed != null) {
    const marker = document.createElement('div');
    marker.className = MARKER_CLASS;
    marker.style.left = `${elapsed}%`;
    marker.title =
      cadence === 'weekly'
        ? 'Even linear burn for this weekly window'
        : 'Even linear burn for this billing window';
    wrap.appendChild(marker);

    const label = document.createElement('div');
    label.className = LABEL_CLASS;
    label.style.left = `${elapsed}%`;
    label.textContent =
      cadence === 'weekly'
        ? `weekly pace ${formatPercent(elapsed)}`
        : `pace ${formatPercent(elapsed)}`;
    wrap.appendChild(label);
  }

  const meta = document.createElement('div');
  meta.className = META_CLASS;
  meta.style.color = statusColor(status);
  meta.textContent = statusLabel(status, cadence);
  wrap.after(meta);

  const domUsed = parseUsedFromFill(fill);
  if (domUsed != null && Math.abs(domUsed - status.usedPct) > 0.5) {
    const card = track.closest('.px-4.py-3') ?? track.parentElement;
    const usedSpan = card
      ? Array.from(card.querySelectorAll('span')).find((span) =>
          /[\d.]+%\s*used/i.test(span.textContent ?? ''),
        )
      : null;
    if (usedSpan) usedSpan.textContent = `${formatPercent(status.usedPct, 2)} used`;
  }
}

export function clearPaceDecorations(): void {
  document.querySelectorAll(`.${WRAP_CLASS}`).forEach((wrap) => {
    const track = wrap.querySelector(TRACK_IN_WRAP);
    if (track) wrap.replaceWith(track);
  });
  document.querySelectorAll(`.${META_CLASS}`).forEach((el) => el.remove());
}

const TRACK_IN_WRAP = '.relative.w-full.overflow-hidden.rounded-full, [class*="rounded-full"]';
