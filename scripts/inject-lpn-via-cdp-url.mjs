#!/usr/bin/env node
/**
 * Inject LPN into a page via Playwright CDP connect.
 * Usage: CDP_URL=ws://... node scripts/inject-lpn-via-cdp-url.mjs [pageUrlSubstring]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cdp = process.env.CDP_URL;
const needle = process.argv[2] ?? 'lichess.org/study';
if (!cdp) {
  console.error('Set CDP_URL to a browser WebSocket debugger URL');
  process.exit(1);
}

const injectPath = path.resolve(
  __dirname,
  '../packages/lichess-position-notes/dist/inject.js',
);
const code = fs.readFileSync(injectPath, 'utf8');

const browser = await chromium.connectOverCDP(cdp);
const page =
  browser
    .contexts()
    .flatMap((c) => c.pages())
    .find((p) => p.url().includes(needle)) ??
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error('No page found');
  process.exit(1);
}
await page.evaluate((src) => {
  const s = document.createElement('script');
  s.textContent = src;
  document.head.appendChild(s);
}, code);
await page.waitForTimeout(3000);
const result = await page.evaluate(() => ({
  url: location.href,
  panel: Boolean(document.getElementById('lpn-position-notes-panel')),
  placed: (() => {
    const panel = document.getElementById('lpn-position-notes-panel');
    const comments = document.querySelector('.analyse__underboard .study__comments');
    return Boolean(panel && comments && panel.previousElementSibling === comments);
  })(),
  title: document.title,
}));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.panel ? 0 : 1);
