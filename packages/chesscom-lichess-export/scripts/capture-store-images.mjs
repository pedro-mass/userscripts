#!/usr/bin/env node
/**
 * Capture store / Greasy Fork listing images from store/screenshots.html
 *
 * Usage: node scripts/capture-store-images.mjs
 * Output: store/images/*.png
 */

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(PKG, 'store', 'screenshots.html');
const ICON_HTML = join(PKG, 'store', 'icon.html');
const OUT = join(PKG, 'store', 'images');

const SCENES = [
  { id: 'game-review-sidebar', file: 'game-review-sidebar.png' },
  { id: 'game-over-modal', file: 'game-over-modal.png' },
  { id: 'share-modal', file: 'share-modal.png' },
  { id: 'promo-1280', file: 'promo-1280x800.png' },
  { id: 'promo-440', file: 'promo-440x280.png' },
];

const ICONS = [
  { id: 'icon-128', file: 'icon-128.png' },
  { id: 'icon-48', file: 'icon-48.png' },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle' });

for (const { id, file } of SCENES) {
  await page.evaluate((sceneId) => {
    for (const el of document.querySelectorAll('.scene')) {
      el.style.visibility = el.id === sceneId ? 'visible' : 'hidden';
    }
  }, id);
  const scene = page.locator(`#${id}`);
  const box = await scene.boundingBox();
  if (!box) throw new Error(`Scene not found: ${id}`);
  await scene.screenshot({ path: join(OUT, file) });
  console.log(`Wrote store/images/${file} (${Math.round(box.width)}×${Math.round(box.height)})`);
}

await page.goto(pathToFileURL(ICON_HTML).href, { waitUntil: 'networkidle' });
for (const { id, file } of ICONS) {
  const icon = page.locator(`#${id}`);
  const box = await icon.boundingBox();
  if (!box) throw new Error(`Icon not found: ${id}`);
  await icon.screenshot({ path: join(OUT, file) });
  console.log(`Wrote store/images/${file} (${Math.round(box.width)}×${Math.round(box.height)})`);
}

await browser.close();
