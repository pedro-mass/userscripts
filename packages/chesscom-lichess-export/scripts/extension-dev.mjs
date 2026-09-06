#!/usr/bin/env node
/**
 * Dev: rebuild extension on source changes; service worker reloads extension when build-meta changes.
 * Refresh chess.com tab after rebuild to pick up content-script changes.
 */
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(root, '..');

let building = false;
let queued = false;
let debounce;

function runBuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const child = spawn('node', ['scripts/build-extension.mjs'], {
    cwd: pkgRoot,
    stdio: 'inherit',
    env: { ...process.env, VITE_EXTENSION_MODE: 'development' },
  });
  child.on('exit', (code) => {
    building = false;
    if (code !== 0) {
      console.error('[cc2l] extension build failed');
    }
    if (queued) {
      queued = false;
      runBuild();
    }
  });
}

function scheduleBuild() {
  clearTimeout(debounce);
  debounce = setTimeout(runBuild, 250);
}

console.log(
  '[cc2l] Watching extension sources. Load unpacked: dist/extension — refresh chess.com after rebuild.',
);

runBuild();

for (const dir of ['src', 'extension']) {
  watch(resolve(pkgRoot, dir), { recursive: true }, scheduleBuild);
}
