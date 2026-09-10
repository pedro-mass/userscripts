// ==UserScript==
// @name         Cursor Spending Pace
// @namespace    https://github.com/pedro-mass/userscripts/cursor-spend-pace
// @version      0.1.0
// @author       pedro-mass
// @description  Shows linear-burn pace markers on the Cursor spending dashboard so you can see if usage is ahead or behind the billing cycle
// @license      GNU GPLv3
// @copyright    2026, Pedro Mass (https://github.com/pedro-mass)
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cursor.com
// @downloadURL  https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/cursor-spend-pace/dist/cursor-spend-pace.user.js
// @updateURL    https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/cursor-spend-pace/dist/cursor-spend-pace.meta.js
// @match        https://cursor.com/*
// @match        https://www.cursor.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function parseTime(value) {
    if (value == null || value === "") return NaN;
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value < 1e12 ? value * 1e3 : value;
    const asNum = Number(value);
    if (Number.isFinite(asNum) && /^\d+(\.\d+)?$/.test(String(value).trim())) {
      return asNum < 1e12 ? asNum * 1e3 : asNum;
    }
    return Date.parse(String(value));
  }
  function pickNumber(obj, keys) {
    if (!obj) return null;
    for (const key of keys) {
      const n = Number(obj[key]);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }
  function elapsedPercent(window2, nowMs = Date.now()) {
    const { startMs, endMs } = window2;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    const totalMs = endMs - startMs;
    const elapsedMs = clamp(nowMs - startMs, 0, totalMs);
    return clamp(elapsedMs / totalMs * 100, 0, 100);
  }
  function paceStatus(usedPct, window2, nowMs = Date.now()) {
    const elapsedPct = elapsedPercent(window2, nowMs);
    const windowMs = window2.endMs - window2.startMs;
    const deltaPct = elapsedPct == null ? null : clamp(usedPct - elapsedPct, -100, 100);
    return { usedPct, elapsedPct, deltaPct, windowMs };
  }
  function formatPercent(value, digits = 1) {
    if (!Number.isFinite(value)) return "n/a";
    return `${value.toFixed(digits).replace(/\.?0+$/, "")}%`;
  }
  function formatRestMs(restMs) {
    const secs = Math.max(0, Math.round(restMs / 1e3));
    if (secs === 0) return "~0m";
    if (secs < 3600) return `~${Math.ceil(secs / 60)}m`;
    if (secs < 86400) {
      const h2 = Math.floor(secs / 3600);
      const m = Math.round(secs % 3600 / 60);
      return m > 0 ? `~${h2}h${m}m` : `~${h2}h`;
    }
    const d = Math.floor(secs / 86400);
    const h = Math.round(secs % 86400 / 3600);
    return h > 0 ? `~${d}d${h}h` : `~${d}d`;
  }
  function restToEvenPaceMs(usedPct, elapsedPct, windowMs) {
    if (usedPct <= elapsedPct || windowMs <= 0) return 0;
    return windowMs * (usedPct - elapsedPct) / 100;
  }
  function statusLabel(status) {
    const { usedPct, elapsedPct, deltaPct, windowMs } = status;
    if (elapsedPct == null || deltaPct == null) return "billing window unavailable";
    if (usedPct >= 100) return "quota exhausted";
    if (deltaPct > 0.5) {
      const rest = formatRestMs(restToEvenPaceMs(usedPct, elapsedPct, windowMs));
      return `ahead of pace · rest ${rest} to even`;
    }
    if (deltaPct < -0.5) {
      return `under pace · ${formatPercent(Math.abs(deltaPct))} headroom`;
    }
    return "on pace";
  }
  const JSON_HEADERS = { "content-type": "application/json" };
  async function loadJson(url, init) {
    const res = await fetch(url, { credentials: "include", ...init });
    if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
    return res.json();
  }
  function postJson(url, body = {}) {
    return loadJson(url, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body)
    });
  }
  function billingWindow(summary, period) {
    const startMs = parseTime(summary == null ? void 0 : summary.billingCycleStart) || parseTime(period == null ? void 0 : period.billingCycleStart);
    const endMs = parseTime(summary == null ? void 0 : summary.billingCycleEnd) || parseTime(period == null ? void 0 : period.billingCycleEnd);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    return { startMs, endMs };
  }
  function grokWindow(grok) {
    if (!grok) return null;
    const startMs = parseTime(grok.currentPeriodStart ?? grok.current_period_start);
    const endMs = parseTime(grok.nextResetTimestampUtc ?? grok.next_reset_timestamp_utc);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    return { startMs, endMs };
  }
  async function loadUsageSnapshot() {
    var _a;
    const [summaryResult, periodResult, grokResult] = await Promise.allSettled([
      loadJson("/api/usage-summary"),
      postJson("/api/dashboard/get-current-period-usage"),
      postJson("/api/dashboard/get-sand-usage-status")
    ]);
    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
    const period = periodResult.status === "fulfilled" ? periodResult.value : null;
    const grok = grokResult.status === "fulfilled" ? grokResult.value : null;
    const plan = (_a = summary == null ? void 0 : summary.individualUsage) == null ? void 0 : _a.plan;
    const usage = period == null ? void 0 : period.planUsage;
    const cursorUsedPct = pickNumber(plan, ["autoPercentUsed", "auto_percent_used"]) ?? pickNumber(usage, ["autoPercentUsed", "auto_percent_used"]);
    const otherUsedPct = pickNumber(plan, ["apiPercentUsed", "api_percent_used"]) ?? pickNumber(usage, ["apiPercentUsed", "api_percent_used"]);
    const grokEnabled = Boolean(
      (grok == null ? void 0 : grok.hasNonZeroIncludedLimit) ?? (grok == null ? void 0 : grok.has_non_zero_included_limit) ?? grok
    );
    return {
      monthlyWindow: billingWindow(summary, period),
      cursorUsedPct,
      otherUsedPct,
      grok: {
        window: grokWindow(grok),
        usedPct: pickNumber(grok, ["usagePercent", "usage_percent"]),
        enabled: grokEnabled
      }
    };
  }
  const TRACK_SELECTOR = ".relative.w-full.overflow-hidden.rounded-full";
  const FILL_SELECTOR = ".absolute.inset-y-0.left-0";
  function isSpendingPage() {
    const path = dashboardPath();
    if (path === "/dashboard/spending" || path.startsWith("/dashboard/spending/") || path === "/dashboard/usage" || path.startsWith("/dashboard/usage/")) {
      return true;
    }
    const tab = new URLSearchParams(location.search).get("tab");
    return path === "/dashboard" && /^(spending|usage)$/i.test(tab ?? "");
  }
  function dashboardPath() {
    const path = (location.pathname.replace(/\/+$/, "") || "/").replace(
      /^\/[a-z]{2}(?:-[A-Za-z]{2})?(?=\/|$)/,
      ""
    );
    return path;
  }
  function sectionRoot(el) {
    if (!el) return null;
    return el.closest(".dashboard-section") ?? el.closest("section") ?? el.parentElement;
  }
  function tracksIn(section) {
    if (!section) return [];
    const primary = Array.from(section.querySelectorAll(TRACK_SELECTOR));
    if (primary.length) return primary;
    return Array.from(section.querySelectorAll('[class*="rounded-full"]')).filter(
      (el) => Boolean(findFill(el))
    );
  }
  function includedSectionRoots() {
    const roots = [];
    const seen = /* @__PURE__ */ new Set();
    const add = (el) => {
      const root = sectionRoot(el);
      if (!root || seen.has(root)) return;
      seen.add(root);
      roots.push(root);
    };
    document.querySelectorAll("[id]").forEach((el) => {
      if (/^included-in-/i.test(el.id)) add(el);
    });
    return roots;
  }
  function findFill(track) {
    return track.querySelector(FILL_SELECTOR) ?? track.querySelector('[style*="width"]');
  }
  function cardText(track) {
    let el = track;
    for (let i = 0; i < 8 && el; i++) {
      const text = el.textContent ?? "";
      if (/Cursor Models|Other Models|Grok Bot|Weekly usage/i.test(text)) return text;
      el = el.parentElement;
    }
    const card = track.closest(".px-4.py-3") ?? track.parentElement;
    return (card == null ? void 0 : card.textContent) ?? "";
  }
  function trackKind(track, fallbackIndex) {
    const text = cardText(track);
    if (/Cursor Models/i.test(text)) return "cursor";
    if (/Other Models/i.test(text)) return "other";
    if (/Weekly usage/i.test(text) || /Grok Bot/i.test(text)) return "grok";
    if (fallbackIndex === 0) return "cursor";
    if (fallbackIndex === 1) return "other";
    return null;
  }
  function uniqueTracks(tracks) {
    const seen = /* @__PURE__ */ new Set();
    return tracks.filter((track) => {
      if (seen.has(track)) return false;
      seen.add(track);
      return true;
    });
  }
  function monthlyTracks() {
    const fromRoots = uniqueTracks(includedSectionRoots().flatMap((root) => tracksIn(root)));
    if (fromRoots.length) return fromRoots;
    return uniqueTracks(Array.from(document.querySelectorAll(TRACK_SELECTOR))).filter(
      (track) => trackKind(track) === "cursor" || trackKind(track) === "other"
    );
  }
  function grokTracks() {
    const section = document.getElementById("grok-bot");
    return uniqueTracks(tracksIn(sectionRoot(section)));
  }
  function hasUsageTracks() {
    return monthlyTracks().length > 0 || grokTracks().length > 0;
  }
  function parseUsedFromFill(fill) {
    const style = (fill == null ? void 0 : fill.getAttribute("style")) ?? "";
    const match = style.match(/width:\s*([\d.]+)%/);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }
  const STYLE_ID = "pm-cursor-pace-style";
  const WRAP_CLASS = "pm-pace-wrap";
  const MARKER_CLASS = "pm-pace-marker";
  const LABEL_CLASS = "pm-pace-label";
  const META_CLASS = "pm-pace-meta";
  const COLOR_AHEAD = "#ca8a04";
  const COLOR_UNDER = "#16a34a";
  const COLOR_ON = "#64748b";
  const COLOR_MARKER = "#0f172a";
  const COLOR_ACCENT = "#0284c7";
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
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
  function wrapTrack(track) {
    const parent = track.parentElement;
    if (parent == null ? void 0 : parent.classList.contains(WRAP_CLASS)) return parent;
    const wrap = document.createElement("div");
    wrap.className = WRAP_CLASS;
    track.before(wrap);
    wrap.appendChild(track);
    return wrap;
  }
  function statusColor(status) {
    const delta = status.deltaPct;
    if (delta == null) return COLOR_ON;
    if (status.usedPct >= 100) return COLOR_AHEAD;
    if (delta > 0.5) return COLOR_AHEAD;
    if (delta < -0.5) return COLOR_UNDER;
    return COLOR_ON;
  }
  function applyPace(track, status) {
    var _a, _b;
    ensureStyle();
    const fill = findFill(track);
    if (!fill) return;
    const wrap = wrapTrack(track);
    const elapsed = status.elapsedPct;
    const showPace = elapsed != null && status.usedPct < 100;
    const signature = [
      status.usedPct.toFixed(4),
      elapsed == null ? "" : elapsed.toFixed(4),
      statusLabel(status)
    ].join("|");
    if (wrap.dataset.pmSig === signature) return;
    wrap.dataset.pmSig = signature;
    (_a = wrap.querySelector(`.${MARKER_CLASS}`)) == null ? void 0 : _a.remove();
    (_b = wrap.querySelector(`.${LABEL_CLASS}`)) == null ? void 0 : _b.remove();
    const next = wrap.nextElementSibling;
    if (next == null ? void 0 : next.classList.contains(META_CLASS)) next.remove();
    if (showPace && elapsed != null) {
      const marker = document.createElement("div");
      marker.className = MARKER_CLASS;
      marker.style.left = `${elapsed}%`;
      marker.title = "Even linear burn for this billing window";
      wrap.appendChild(marker);
      const label = document.createElement("div");
      label.className = LABEL_CLASS;
      label.style.left = `${elapsed}%`;
      label.textContent = `pace ${formatPercent(elapsed)}`;
      wrap.appendChild(label);
    }
    const meta = document.createElement("div");
    meta.className = META_CLASS;
    meta.style.color = statusColor(status);
    meta.textContent = statusLabel(status);
    wrap.after(meta);
    const domUsed = parseUsedFromFill(fill);
    if (domUsed != null && Math.abs(domUsed - status.usedPct) > 0.5) {
      const card = track.closest(".px-4.py-3") ?? track.parentElement;
      const usedSpan = card ? Array.from(card.querySelectorAll("span")).find(
        (span) => /[\d.]+%\s*used/i.test(span.textContent ?? "")
      ) : null;
      if (usedSpan) usedSpan.textContent = `${formatPercent(status.usedPct, 2)} used`;
    }
  }
  function clearPaceDecorations() {
    document.querySelectorAll(`.${WRAP_CLASS}`).forEach((wrap) => {
      const track = wrap.querySelector(TRACK_IN_WRAP);
      if (track) wrap.replaceWith(track);
    });
    document.querySelectorAll(`.${META_CLASS}`).forEach((el) => el.remove());
  }
  const TRACK_IN_WRAP = '.relative.w-full.overflow-hidden.rounded-full, [class*="rounded-full"]';
  const LOG_PREFIX = "[cursor-spend-pace]";
  let snapshot = null;
  let refreshing = false;
  let refreshQueued = false;
  let fetchTimer = 0;
  let renderTimer = 0;
  let applying = false;
  let pendingRender = false;
  let observer = null;
  let lastHref = location.href;
  boot();
  function boot() {
    hookHistory();
    startHrefPoll();
    syncPageMode();
  }
  function logWarn(label, err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(LOG_PREFIX, label, message);
  }
  function hookHistory() {
    const notify = () => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      syncPageMode();
    };
    const wrap = (original) => function wrapped(...args) {
      const result = original.apply(this, args);
      notify();
      return result;
    };
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener("popstate", notify);
  }
  function startHrefPoll() {
    window.setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        syncPageMode();
      }
    }, 1500);
  }
  function syncPageMode() {
    if (isSpendingPage()) {
      ensureObserver();
      scheduleFetch(true);
      return;
    }
    stopObserver();
    clearPaceDecorations();
    snapshot = null;
  }
  function ensureObserver() {
    if (observer) return;
    observer = new MutationObserver(() => scheduleRender());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  function stopObserver() {
    observer == null ? void 0 : observer.disconnect();
    observer = null;
  }
  function scheduleFetch(force = false) {
    if (fetchTimer && !force) return;
    window.clearTimeout(fetchTimer);
    fetchTimer = window.setTimeout(() => {
      fetchTimer = 0;
      void refresh();
    }, force ? 50 : 150);
  }
  function scheduleRender() {
    if (applying) {
      pendingRender = true;
      return;
    }
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(render, 80);
  }
  async function refresh() {
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
      logWarn("refresh", err);
    } finally {
      refreshing = false;
      if (refreshQueued) {
        refreshQueued = false;
        scheduleFetch(true);
      }
    }
  }
  function usedPctForKind(kind) {
    if (!snapshot) return 0;
    if (kind === "cursor") return snapshot.cursorUsedPct ?? 0;
    if (kind === "other") return snapshot.otherUsedPct ?? 0;
    return snapshot.grok.usedPct ?? 0;
  }
  function render() {
    if (!isSpendingPage() || !snapshot || applying) {
      if (isSpendingPage() && snapshot && applying) pendingRender = true;
      return;
    }
    applying = true;
    try {
      const now = Date.now();
      const monthlyWindow = snapshot.monthlyWindow;
      monthlyTracks().forEach((track, index) => {
        const kind = trackKind(track, index);
        if (kind !== "cursor" && kind !== "other") return;
        if (!monthlyWindow) return;
        const status = paceStatus(usedPctForKind(kind), monthlyWindow, now);
        applyPace(track, status);
      });
      if (snapshot.grok.enabled && snapshot.grok.window) {
        grokTracks().forEach((track) => {
          const status = paceStatus(usedPctForKind("grok"), snapshot.grok.window, now);
          applyPace(track, status);
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

})();