export const STYLE_ID = 'pm-cursor-pace-style';
export const WRAP_CLASS = 'pm-pace-wrap';
export const MARKER_CLASS = 'pm-pace-marker';
export const LABEL_CLASS = 'pm-pace-label';
export const META_CLASS = 'pm-pace-meta';

export type PaceTone = 'under' | 'ahead' | 'on' | 'neutral';

export function paceTone(status: {
  usedPct: number;
  deltaPct: number | null;
}): PaceTone {
  const delta = status.deltaPct;
  if (delta == null) return 'neutral';
  if (status.usedPct >= 100) return 'ahead';
  if (delta > 0.5) return 'ahead';
  if (delta < -0.5) return 'under';
  return 'on';
}

/** WCAG AA–oriented tokens for light and dark surfaces. */
export function paceStylesheet(): string {
  const w = WRAP_CLASS;
  const m = MARKER_CLASS;
  const l = LABEL_CLASS;
  const meta = META_CLASS;

  return `
    :root {
      --pm-pace-under: #166534;
      --pm-pace-ahead: #b45309;
      --pm-pace-on: #475569;
      --pm-pace-neutral: #64748b;
      --pm-pace-accent: #0369a1;
      --pm-pace-marker: #0369a1;
      --pm-pace-marker-ring: #ffffff;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --pm-pace-under: #4ade80;
        --pm-pace-ahead: #fbbf24;
        --pm-pace-on: #cbd5e1;
        --pm-pace-neutral: #94a3b8;
        --pm-pace-accent: #38bdf8;
        --pm-pace-marker: #e2e8f0;
        --pm-pace-marker-ring: #0f172a;
      }
    }

    html.dark,
    html[data-theme='dark'],
    body.dark,
    [data-theme='dark'] {
      --pm-pace-under: #4ade80;
      --pm-pace-ahead: #fbbf24;
      --pm-pace-on: #cbd5e1;
      --pm-pace-neutral: #94a3b8;
      --pm-pace-accent: #38bdf8;
      --pm-pace-marker: #e2e8f0;
      --pm-pace-marker-ring: #0f172a;
    }

    html.light,
    html[data-theme='light'],
    body.light,
    [data-theme='light'] {
      --pm-pace-under: #166534;
      --pm-pace-ahead: #b45309;
      --pm-pace-on: #475569;
      --pm-pace-neutral: #64748b;
      --pm-pace-accent: #0369a1;
      --pm-pace-marker: #0369a1;
      --pm-pace-marker-ring: #ffffff;
    }

    @media (prefers-contrast: more) {
      :root {
        --pm-pace-under: #14532d;
        --pm-pace-ahead: #92400e;
        --pm-pace-accent: #075985;
        --pm-pace-marker: #075985;
      }
      html.dark,
      html[data-theme='dark'],
      body.dark,
      [data-theme='dark'] {
        --pm-pace-under: #86efac;
        --pm-pace-ahead: #fde047;
        --pm-pace-accent: #7dd3fc;
        --pm-pace-marker: #f8fafc;
      }
    }

    .${w} { position: relative; overflow: visible; }
    .${w} .${m} {
      position: absolute;
      top: -4px;
      height: calc(100% + 4px);
      width: 3px;
      margin-left: -1.5px;
      background: var(--pm-pace-marker);
      box-shadow: 0 0 0 1px var(--pm-pace-marker-ring), 0 0 0 2px var(--pm-pace-accent);
      border-radius: 1px;
      z-index: 3;
      pointer-events: none;
    }
    .${w} .${l} {
      position: absolute;
      top: calc(100% + 6px);
      z-index: 3;
      pointer-events: none;
      font: 11px/1.2 ui-sans-serif, system-ui, sans-serif;
      font-weight: 600;
      color: var(--pm-pace-accent);
      white-space: nowrap;
      transform: translateX(-50%);
    }
    .${meta} {
      margin-top: 22px;
      font: 11px/1.35 ui-sans-serif, system-ui, sans-serif;
      font-weight: 600;
      color: var(--pm-pace-neutral);
    }
    .${meta}[data-pm-tone='under'] { color: var(--pm-pace-under); }
    .${meta}[data-pm-tone='ahead'] { color: var(--pm-pace-ahead); }
    .${meta}[data-pm-tone='on'] { color: var(--pm-pace-on); }
    .${meta}[data-pm-tone='neutral'] { color: var(--pm-pace-neutral); }
  `;
}
