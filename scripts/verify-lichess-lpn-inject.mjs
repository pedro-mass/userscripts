#!/usr/bin/env node
/**
 * Inject built lichess-position-notes bundle into a page context (Playwright).
 * Use for verify-in-browser when Tampermonkey is unavailable.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const injectPath = path.resolve(
  __dirname,
  '../packages/lichess-position-notes/dist/inject.js',
);
const studyUrl =
  process.argv[2] ?? 'https://lichess.org/study/oDP5q102/XlPOdNrd';

if (!fs.existsSync(injectPath)) {
  console.error('Missing inject.js — run: pnpm --filter @userscripts/lichess-position-notes build');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });
const t0 = Date.now();
await page.goto(studyUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
const title = await page.title();
if (/not found/i.test(title)) {
  console.error(
    JSON.stringify({
      ok: false,
      err: 'study_not_found_guest',
      hint:
        'Private studies need a saved Playwright storageState (logged-in). Use in-app browser CDP inject on the real chapter URL.',
      url: page.url(),
    }),
  );
  await browser.close();
  process.exit(2);
}
await page.waitForSelector('.analyse__underboard', { timeout: 90_000 });
await page.addScriptTag({ path: injectPath });
await page.waitForTimeout(2500);
await page.getByRole('tab', { name: /Comment on this position/i }).click();
await page.waitForTimeout(2500);
const result = await page.evaluate(() => ({
  url: location.href,
  panel: Boolean(document.getElementById('lpn-position-notes-panel')),
  placed: (() => {
    const panel = document.getElementById('lpn-position-notes-panel');
    const comments = document.querySelector('.analyse__underboard .study__comments');
    return Boolean(panel && comments && panel.previousElementSibling === comments);
  })(),
  heading: document.querySelector('.lpn-prior-heading')?.textContent ?? null,
  summary: document.querySelector('.lpn-meta summary')?.textContent ?? null,
  hasCommentBox: Boolean(document.querySelector('#comment-text')),
}));
const shot = path.resolve(__dirname, '../.work/lpn-verify-screenshot.png');
fs.mkdirSync(path.dirname(shot), { recursive: true });
await page.screenshot({ path: shot, fullPage: false });
await browser.close();
const out = {
  ...result,
  elapsedMs: Date.now() - t0,
  screenshot: shot,
  ok: result.panel && result.hasCommentBox,
};
console.log(JSON.stringify(out, null, 2));
process.exit(out.ok ? 0 : 1);
