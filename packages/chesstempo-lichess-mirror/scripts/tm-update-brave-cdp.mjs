#!/usr/bin/env node
/**
 * Click Tampermonkey Update/Reinstall/Install (Brave CDP).
 * Reuses a clutter tab for the install URL when possible (avoids about:blank spam).
 */
import { chromium } from 'playwright';
import { cleanupMirrorTabs, isMirrorClutterUrl } from './brave-cdp-cleanup.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const PORT = Number(process.env.TM_SERVE_PORT ?? 8765);
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const SCRIPT_URL = `http://127.0.0.1:${PORT}/chesstempo-lichess-mirror.user.js`;

async function ensureServer() {
  try {
    await fetch(SCRIPT_URL, { method: 'HEAD' });
    return null;
  } catch {
    const child = spawn('python3', ['-m', 'http.server', String(PORT)], {
      cwd: DIST,
      stdio: 'ignore',
    });
    await new Promise((r) => setTimeout(r, 400));
    return child;
  }
}

function pickInstallCarrier(ctx) {
  const pages = ctx.pages();
  const ask = pages.find((p) => p.url().includes('ask.html'));
  if (ask) return { page: ask, created: false };

  const clutter = pages.find(
    (p) =>
      isMirrorClutterUrl(p.url()) &&
      !p.url().includes('chesstempo.com/opening-training'),
  );
  if (clutter) return { page: clutter, created: false };

  const blank = pages.find((p) => p.url() === 'about:blank');
  if (blank) return { page: blank, created: false };

  return { page: null, created: false };
}

let browser;
try {
  browser = await chromium.connectOverCDP(CDP);
} catch (e) {
  console.log(JSON.stringify({ ok: false, err: 'cdp_connect_failed', message: String(e) }));
  process.exit(2);
}

const server = await ensureServer();
const ctx = browser.contexts()[0];
const cleanupBefore = await cleanupMirrorTabs(ctx);

let { page: carrier } = pickInstallCarrier(ctx);
const hasAsk = ctx.pages().some((p) => p.url().includes('ask.html'));

if (!hasAsk) {
  if (!carrier) {
    carrier = await ctx.newPage();
  }
  await carrier.goto(SCRIPT_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  for (let i = 0; i < 24; i++) {
    if (ctx.pages().some((p) => p.url().includes('ask.html'))) break;
    await carrier.waitForTimeout(500);
  }
}

const candidates = ctx.pages().filter((p) => p.url().includes('ask.html'));
let clicked = false;
for (const page of candidates) {
  const body = await page.locator('body').innerText();
  if (!body.includes('ChessTempo') && !body.includes('Lichess mirror')) continue;
  let btn = null;
  for (const label of ['Update', 'Reinstall', 'Install']) {
    const loc = page.locator(`input.button.install[value="${label}"]`);
    if ((await loc.count()) > 0) {
      btn = loc.first();
      break;
    }
  }
  if (!btn) continue;
  await page.bringToFront();
  await btn.click();
  clicked = true;
  await new Promise((r) => setTimeout(r, 1200));
  break;
}

const cleanupAfter = await cleanupMirrorTabs(ctx);

try {
  await browser.close();
} catch {
  /* reinstall may detach CDP target */
}

if (server) server.kill();

console.log(
  JSON.stringify(
    { ok: clicked, scriptUrl: SCRIPT_URL, cleanupBefore, cleanupAfter },
    null,
    2,
  ),
);
process.exit(clicked ? 0 : 1);
