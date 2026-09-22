import type { PaceCadence, PaceStatus } from './pacing';
import { formatPercent, statusLabel } from './pacing';
import { findFill, parseUsedFromFill, TRACK_IN_WRAP_SELECTOR } from './dom/shared';
import {
  LABEL_CLASS,
  MARKER_CLASS,
  META_CLASS,
  paceStylesheet,
  paceTone,
  STYLE_ID,
  WRAP_CLASS,
} from './theme';

function ensureStyle(): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    (document.head ?? document.documentElement).appendChild(style);
  }
  const css = paceStylesheet();
  if (style.textContent !== css) style.textContent = css;
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
  const tone = paceTone(status);
  const signature = [
    status.usedPct.toFixed(4),
    elapsed == null ? '' : elapsed.toFixed(4),
    statusLabel(status, cadence),
    cadence,
    tone,
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
    marker.setAttribute('aria-hidden', 'true');
    marker.style.left = `${elapsed}%`;
    marker.title =
      cadence === 'weekly'
        ? 'Even linear burn for this weekly window'
        : 'Even linear burn for this billing window';
    wrap.appendChild(marker);

    const label = document.createElement('div');
    label.className = LABEL_CLASS;
    label.setAttribute('aria-hidden', 'true');
    label.style.left = `${elapsed}%`;
    label.textContent =
      cadence === 'weekly'
        ? `weekly pace ${formatPercent(elapsed)}`
        : `pace ${formatPercent(elapsed)}`;
    wrap.appendChild(label);
  }

  const meta = document.createElement('div');
  meta.className = META_CLASS;
  meta.dataset.pmTone = tone;
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

const TRACK_IN_WRAP = TRACK_IN_WRAP_SELECTOR;
