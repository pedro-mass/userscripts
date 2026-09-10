export type TimeWindow = {
  startMs: number;
  endMs: number;
};

export type PaceStatus = {
  usedPct: number;
  elapsedPct: number | null;
  deltaPct: number | null;
  windowMs: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseTime(value: unknown): number {
  if (value == null || value === '') return NaN;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  const asNum = Number(value);
  if (Number.isFinite(asNum) && /^\d+(\.\d+)?$/.test(String(value).trim())) {
    return asNum < 1e12 ? asNum * 1000 : asNum;
  }
  return Date.parse(String(value));
}

export function pickNumber(
  obj: Record<string, unknown> | null | undefined,
  keys: string[],
): number | null {
  if (!obj) return null;
  for (const key of keys) {
    const n = Number(obj[key]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Share of the billing window that has elapsed (0–100). */
export function elapsedPercent(window: TimeWindow, nowMs = Date.now()): number | null {
  const { startMs, endMs } = window;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }
  const totalMs = endMs - startMs;
  const elapsedMs = clamp(nowMs - startMs, 0, totalMs);
  return clamp((elapsedMs / totalMs) * 100, 0, 100);
}

export function paceStatus(
  usedPct: number,
  window: TimeWindow,
  nowMs = Date.now(),
): PaceStatus {
  const elapsedPct = elapsedPercent(window, nowMs);
  const windowMs = window.endMs - window.startMs;
  const deltaPct =
    elapsedPct == null ? null : clamp(usedPct - elapsedPct, -100, 100);
  return { usedPct, elapsedPct, deltaPct, windowMs };
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return 'n/a';
  return `${value.toFixed(digits).replace(/\.?0+$/, '')}%`;
}

export function formatRestMs(restMs: number): string {
  const secs = Math.max(0, Math.round(restMs / 1000));
  if (secs === 0) return '~0m';
  if (secs < 3600) return `~${Math.ceil(secs / 60)}m`;
  if (secs < 86400) {
    const h = Math.floor(secs / 3600);
    const m = Math.round((secs % 3600) / 60);
    return m > 0 ? `~${h}h${m}m` : `~${h}h`;
  }
  const d = Math.floor(secs / 86400);
  const h = Math.round((secs % 86400) / 3600);
  return h > 0 ? `~${d}d${h}h` : `~${d}d`;
}

/** Time until usage would hit even pace if burn rate stays constant. */
export function restToEvenPaceMs(usedPct: number, elapsedPct: number, windowMs: number): number {
  if (usedPct <= elapsedPct || windowMs <= 0) return 0;
  return (windowMs * (usedPct - elapsedPct)) / 100;
}

export function statusLabel(status: PaceStatus): string {
  const { usedPct, elapsedPct, deltaPct, windowMs } = status;
  if (elapsedPct == null || deltaPct == null) return 'billing window unavailable';
  if (usedPct >= 100) return 'quota exhausted';
  if (deltaPct > 0.5) {
    const rest = formatRestMs(restToEvenPaceMs(usedPct, elapsedPct, windowMs));
    return `ahead of pace · rest ${rest} to even`;
  }
  if (deltaPct < -0.5) {
    return `under pace · ${formatPercent(Math.abs(deltaPct))} headroom`;
  }
  return 'on pace';
}

/** Dev-only self-check: `node -e "..."` or import in REPL. */
export function assertPacingSelfCheck(): void {
  const start = Date.parse('2026-09-01T00:00:00Z');
  const end = Date.parse('2026-10-01T00:00:00Z');
  const mid = start + (end - start) / 2;
  const half = elapsedPercent({ startMs: start, endMs: end }, mid);
  if (half == null || Math.abs(half - 50) > 0.01) {
    throw new Error('elapsedPercent mid-cycle check failed');
  }
}
