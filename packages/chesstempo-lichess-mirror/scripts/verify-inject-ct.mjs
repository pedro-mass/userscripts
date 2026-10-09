#!/usr/bin/env node
/** Smoke: inject bundle on CT (no GM — button only, no cross-tab sync). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const injectPath = path.resolve(__dirname, '../dist/inject.js');
const ctUrl =
  process.argv[2] ?? 'https://www.chesstempo.com/opening-training/';

if (!fs.existsSync(injectPath)) {
  console.error('Missing inject.js — run: pnpm build');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(ctUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.waitForTimeout(5000);
await page.addScriptTag({ path: injectPath });
await page.waitForTimeout(3000);

const probe = await page.evaluate(() => ({
  url: location.href,
  mirrorLoaded: !!window.__pamCtMirrorLoaded,
  openBtn: !!document.getElementById('pam-ct-open-lichess'),
  openingExplorer: !!document.querySelector('opening-explorer'),
}));

console.log(JSON.stringify({ ok: probe.mirrorLoaded && probe.openBtn, ...probe }, null, 2));
await browser.close();
process.exit(probe.mirrorLoaded && probe.openBtn ? 0 : 1);
