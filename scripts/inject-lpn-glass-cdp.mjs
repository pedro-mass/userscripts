#!/usr/bin/env node
/**
 * Sequential CDP chunk inject for Cursor glass browser.
 * Reads WS URL from argv[1] or CDP_URL env (ws://...).
 * Usage: CDP_URL=ws://... node scripts/inject-lpn-glass-cdp.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cdp = process.env.CDP_URL || process.argv[2];
if (!cdp) {
  console.error('Set CDP_URL or pass WebSocket URL as argv[2]');
  process.exit(1);
}

const chunksDir = '/tmp';
const parts = fs
  .readdirSync(chunksDir)
  .filter((f) => /^lpn-chunk-expr-\d+\.txt$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
if (!parts.length) {
  console.error('Run make-lpn-cdp-chunks.mjs after build');
  process.exit(1);
}

const browser = await chromium.connectOverCDP(cdp);
const page =
  browser
    .contexts()
    .flatMap((c) => c.pages())
    .find((p) => p.url().includes('lichess.org/study')) ??
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error('No page');
  process.exit(1);
}

await page.evaluate(() => {
  delete window.__lpnGzB64;
});
for (const f of parts) {
  const expr = fs.readFileSync(path.join(chunksDir, f), 'utf8');
  await page.evaluate(expr);
}
const final = fs.readFileSync('/tmp/lpn-cdp-final.js', 'utf8');
const result = await page.evaluate(final);
await page.getByRole('tab', { name: /Comment on this position/i }).click().catch(() => {});
await page.waitForTimeout(2000);
const after = await page.evaluate(() => ({
  panel: Boolean(document.getElementById('lpn-position-notes-panel')),
  placed: (() => {
    const panel = document.getElementById('lpn-position-notes-panel');
    const comments = document.querySelector('.analyse__underboard .study__comments');
    return Boolean(panel && comments && panel.previousElementSibling === comments);
  })(),
  summary: document.querySelector('.lpn-meta summary')?.textContent ?? null,
}));
const shot = path.resolve(__dirname, '../.work/lpn-inapp-comments-tab.png');
fs.mkdirSync(path.dirname(shot), { recursive: true });
await page.screenshot({ path: shot });
console.log(JSON.stringify({ inject: result, after, screenshot: shot }, null, 2));
await browser.close();
process.exit(after.panel ? 0 : 1);
