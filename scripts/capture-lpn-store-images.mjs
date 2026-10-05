#!/usr/bin/env node
/** Capture GF listing shots from Brave CDP (TM + LPN loaded). */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'packages/lichess-position-notes/store/images');
const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const studyUrl =
  process.argv[2] ?? 'https://lichess.org/study/oDP5q102/8Wjgh8Nh';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.connectOverCDP(CDP);
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes('lichess.org/study')) ?? ctx.pages()[0];
await page.goto(studyUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });

const commentBtn = page.getByRole('button', { name: /comment/i });
if (await commentBtn.count()) {
  await commentBtn.first().click({ timeout: 8000 }).catch(() => {});
}
await page.waitForTimeout(2500);
for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
await page.waitForTimeout(1000);

const clipUnder = await page.evaluate(() => {
  const el = document.querySelector('.analyse__underboard');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
if (!clipUnder) {
  console.error('No .analyse__underboard — open Comments on a study chapter');
  process.exit(1);
}
await page.screenshot({
  path: join(OUT, 'study-underboard.png'),
  clip: clipUnder,
});

const panel = await page.evaluate(() =>
  Boolean(document.getElementById('lpn-position-notes-panel')),
);
console.log(
  JSON.stringify({ ok: panel, out: OUT, files: ['study-underboard.png'] }, null, 2),
);
await browser.close();
process.exit(panel ? 0 : 2);
