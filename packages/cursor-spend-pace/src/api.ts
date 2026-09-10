import { parseTime, pickNumber, type TimeWindow } from './pacing';

const JSON_HEADERS = { 'content-type': 'application/json' };

async function loadJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function postJson<T>(url: string, body: Record<string, unknown> = {}): Promise<T> {
  return loadJson<T>(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export type UsageSnapshot = {
  monthlyWindow: TimeWindow | null;
  cursorUsedPct: number | null;
  otherUsedPct: number | null;
  grok: {
    window: TimeWindow | null;
    usedPct: number | null;
  };
};

type UsageSummary = {
  billingCycleStart?: string | number;
  billingCycleEnd?: string | number;
  individualUsage?: {
    plan?: Record<string, unknown>;
  };
};

type PeriodUsage = {
  billingCycleStart?: string | number;
  billingCycleEnd?: string | number;
  planUsage?: Record<string, unknown>;
};

type GrokUsage = Record<string, unknown>;

const GROK_START_KEYS = [
  'currentPeriodStart',
  'current_period_start',
  'periodStart',
  'period_start',
  'windowStart',
  'window_start',
];

const GROK_END_KEYS = [
  'nextResetTimestampUtc',
  'next_reset_timestamp_utc',
  'nextResetAt',
  'next_reset_at',
  'resetAt',
  'reset_at',
  'periodEnd',
  'period_end',
  'windowEnd',
  'window_end',
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function pickNested(obj: unknown, keys: string[], depth = 0): unknown {
  if (obj == null || depth > 4) return null;
  if (typeof obj !== 'object') return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] != null && record[key] !== '') return record[key];
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const found = pickNested(value, keys, depth + 1);
      if (found != null && found !== '') return found;
    }
  }
  return null;
}

function billingWindow(summary: UsageSummary | null, period: PeriodUsage | null): TimeWindow | null {
  const startMs =
    parseTime(summary?.billingCycleStart) || parseTime(period?.billingCycleStart);
  const endMs = parseTime(summary?.billingCycleEnd) || parseTime(period?.billingCycleEnd);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }
  return { startMs, endMs };
}

function grokWindow(grok: GrokUsage | null): TimeWindow | null {
  if (!grok) return null;
  const startMs = parseTime(pickNested(grok, GROK_START_KEYS));
  const endMs = parseTime(pickNested(grok, GROK_END_KEYS));
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
    return { startMs, endMs };
  }
  if (Number.isFinite(endMs)) {
    return { startMs: endMs - WEEK_MS, endMs };
  }
  if (Number.isFinite(startMs)) {
    return { startMs, endMs: startMs + WEEK_MS };
  }
  return null;
}

export async function loadUsageSnapshot(): Promise<UsageSnapshot> {
  const [summaryResult, periodResult, grokResult] = await Promise.allSettled([
    loadJson<UsageSummary>('/api/usage-summary'),
    postJson<PeriodUsage>('/api/dashboard/get-current-period-usage'),
    postJson<GrokUsage>('/api/dashboard/get-sand-usage-status'),
  ]);

  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const period = periodResult.status === 'fulfilled' ? periodResult.value : null;
  const grok = grokResult.status === 'fulfilled' ? grokResult.value : null;

  const plan = summary?.individualUsage?.plan;
  const usage = period?.planUsage;

  const cursorUsedPct =
    pickNumber(plan, ['autoPercentUsed', 'auto_percent_used']) ??
    pickNumber(usage, ['autoPercentUsed', 'auto_percent_used']);

  const otherUsedPct =
    pickNumber(plan, ['apiPercentUsed', 'api_percent_used']) ??
    pickNumber(usage, ['apiPercentUsed', 'api_percent_used']);

  const grokUsedRaw = pickNested(grok, ['usagePercent', 'usage_percent']);
  const grokUsed = Number(grokUsedRaw);

  return {
    monthlyWindow: billingWindow(summary, period),
    cursorUsedPct,
    otherUsedPct,
    grok: {
      window: grokWindow(grok),
      usedPct: Number.isFinite(grokUsed) ? grokUsed : null,
    },
  };
}
