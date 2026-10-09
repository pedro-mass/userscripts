#!/usr/bin/env node
/**
 * Close accumulated mirror / Tampermonkey tabs in Brave (CDP).
 * Safe: keeps normal browsing tabs; targets mirror test clutter only.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';

export function isMirrorClutterUrl(url) {
  if (!url || url.startsWith('devtools://')) return false;
  if (url.includes('lichess.org/analysis')) return true;
  if (url.includes('ask.html')) return true;
  if (url.includes('tampermonkey.net/script_installation')) return true;
  if (url.includes('chesstempo-lichess-mirror.user.js')) return true;
  if (url.includes(`127.0.0.1:${process.env.TM_SERVE_PORT ?? 8765}/`)) return true;
  return false;
}

/**
 * @param {import('playwright').BrowserContext} ctx
 * @param {{ keepLichessUrl?: string | null }} opts
 */
export async function cleanupMirrorTabs(ctx, opts = {}) {
  const closed = [];
  const kept = [];
  const keepLichess = opts.keepLichessUrl?.split('?')[0] ?? null;

  for (const page of [...ctx.pages()]) {
    const url = page.url();
    if (!isMirrorClutterUrl(url)) continue;

    if (
      keepLichess &&
      url.includes('lichess.org/analysis') &&
      url.split('?')[0] === keepLichess
    ) {
      kept.push(url.slice(0, 100));
      continue;
    }

    try {
      await page.close();
      closed.push(url.slice(0, 100));
    } catch {
      /* already gone */
    }
  }

  return { closed, kept, remaining: ctx.pages().length };
}

export async function runCleanupCli() {
  let browser;
  try {
    browser = await chromium.connectOverCDP(CDP);
  } catch (e) {
    console.log(
      JSON.stringify({ ok: false, err: 'cdp_connect_failed', message: String(e) }),
    );
    process.exit(2);
  }
  const ctx = browser.contexts()[0];
  const result = await cleanupMirrorTabs(ctx);
  try {
    await browser.close();
  } catch {
    /* ok */
  }
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  runCleanupCli();
}
