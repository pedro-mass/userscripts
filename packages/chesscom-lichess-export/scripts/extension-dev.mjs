#!/usr/bin/env node
/**
 * Dev loop: rebuild extension on change; service worker broadcasts DEV_RELOAD to chess.com tabs.
 * Load unpacked from packages/chesscom-lichess-export/dist/extension once, then leave open.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(root, '..');

const child = spawn(
  'pnpm',
  ['exec', 'vite', 'build', '--watch', '--mode', 'development', '--config', 'vite.config.extension.ts'],
  { cwd: pkgRoot, stdio: 'inherit', shell: true },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

console.log(
  '[cc2l] Extension dev watch running. Load unpacked: dist/extension — edits warm-reload on chess.com tabs.',
);
