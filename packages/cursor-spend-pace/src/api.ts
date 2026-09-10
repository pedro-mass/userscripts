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
    enabled: boolean;
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

type GrokUsage = {
  currentPeriodStart?: string | number;
  current_period_start?: string | number;
  nextResetTimestampUtc?: string | number;
  next_reset_timestamp_utc?: string | number;
  usagePercent?: number;
  usage_percent?: number;
  hasNonZeroIncludedLimit?: boolean;
  has_non_zero_included_limit?: boolean;
};

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
  const startMs = parseTime(grok.currentPeriodStart ?? grok.current_period_start);
  const endMs = parseTime(grok.nextResetTimestampUtc ?? grok.next_reset_timestamp_utc);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }
  return { startMs, endMs };
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

  const grokEnabled = Boolean(
    grok?.hasNonZeroIncludedLimit ?? grok?.has_non_zero_included_limit ?? grok,
  );

  return {
    monthlyWindow: billingWindow(summary, period),
    cursorUsedPct,
    otherUsedPct,
    grok: {
      window: grokWindow(grok),
      usedPct: pickNumber(grok, ['usagePercent', 'usage_percent']),
      enabled: grokEnabled,
    },
  };
}
