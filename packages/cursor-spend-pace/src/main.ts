import { loadUsageSnapshot, type UsageSnapshot } from './api';
import { findFill, isSpendingPage, parseUsedFromFill } from './dom/shared';
import { detectPlatform, findGrokTracks } from './platform';
import { enterpriseUsedPctFromDom } from './platform/enterprise/tracks';
import { paceStatus } from './pacing';
import { applyPace, clearPaceDecorations } from './render';

const LOG_PREFIX = '[cursor-spend-pace]';

let snapshot: UsageSnapshot | null = null;
let refreshing = false;
let refreshQueued = false;
let fetchTimer = 0;
let renderTimer = 0;
let applying = false;
let pendingRender = false;
let observer: MutationObserver | null = null;
let lastHref = location.href;

boot();

function boot(): void {
  hookHistory();
  startHrefPoll();
  syncPageMode();
}

function logWarn(label: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(LOG_PREFIX, label, message);
}

function hookHistory(): void {
  const notify = () => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    syncPageMode();
  };

  const wrap = (original: History['pushState']) =>
    function wrapped(this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      notify();
      return result;
    };

  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener('popstate', notify);
}

function startHrefPoll(): void {
  window.setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      syncPageMode();
    }
  }, 1500);
}

function syncPageMode(): void {
  if (isSpendingPage()) {
    ensureObserver();
    scheduleFetch(true);
    return;
  }
  stopObserver();
  clearPaceDecorations();
  snapshot = null;
}

function ensureObserver(): void {
  if (observer) return;
  observer = new MutationObserver(() => scheduleRender());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function stopObserver(): void {
  observer?.disconnect();
  observer = null;
}

function scheduleFetch(force = false): void {
  if (fetchTimer && !force) return;
  window.clearTimeout(fetchTimer);
  fetchTimer = window.setTimeout(() => {
    fetchTimer = 0;
    void refresh();
  }, force ? 50 : 150);
}

function scheduleRender(): void {
  if (applying) {
    pendingRender = true;
    return;
  }
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(render, 80);
}

async function refresh(): Promise<void> {
  if (!isSpendingPage()) return;
  if (refreshing) {
    refreshQueued = true;
    return;
  }
  refreshing = true;
  try {
    snapshot = await loadUsageSnapshot();
    render();
    if (!hasUsageTracks()) {
      window.setTimeout(() => {
        if (isSpendingPage() && hasUsageTracks()) render();
      }, 800);
    }
  } catch (err) {
    logWarn('refresh', err);
  } finally {
    refreshing = false;
    if (refreshQueued) {
      refreshQueued = false;
      scheduleFetch(true);
    }
  }
}

function hasUsageTracks(): boolean {
  if (!snapshot) return false;
  const adapter = detectPlatform(snapshot);
  return adapter.findMonthlyTracks().length > 0 || findGrokTracks().length > 0;
}

function resolveUsedPct(
  adapter: ReturnType<typeof detectPlatform>,
  track: HTMLElement,
  kind: Parameters<typeof adapter.usedPct>[0],
): number {
  const fromApi = adapter.usedPct(kind, snapshot!);
  if (fromApi != null) return fromApi;
  if (adapter.id === 'enterprise-team') {
    const fromDom = enterpriseUsedPctFromDom(track);
    if (fromDom != null) return fromDom;
  }
  return parseUsedFromFill(findFill(track)) ?? 0;
}

function render(): void {
  if (!isSpendingPage() || !snapshot || applying) {
    if (isSpendingPage() && snapshot && applying) pendingRender = true;
    return;
  }

  applying = true;
  try {
    const now = Date.now();
    const adapter = detectPlatform(snapshot);
    const monthlyWindow = snapshot.monthlyWindow;

    adapter.findMonthlyTracks().forEach((track, index) => {
      const kind = adapter.trackKind(track, index);
      if (!kind || !monthlyWindow) return;
      const used = resolveUsedPct(adapter, track, kind);
      const status = paceStatus(used, monthlyWindow, now);
      applyPace(track, status);
    });

    const grokWindow = snapshot.grok.window;
    const grokUsedPct = snapshot.grok.usedPct;
    if (grokWindow) {
      findGrokTracks().forEach((track) => {
        const used = grokUsedPct ?? parseUsedFromFill(findFill(track)) ?? 0;
        const status = paceStatus(used, grokWindow, now);
        applyPace(track, status, 'weekly');
      });
    }
  } finally {
    applying = false;
    if (pendingRender) {
      pendingRender = false;
      scheduleRender();
    }
  }
}
