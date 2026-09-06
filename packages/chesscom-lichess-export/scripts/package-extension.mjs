import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extDir = resolve(root, 'dist/extension');
const manifest = JSON.parse(
  readFileSync(resolve(extDir, 'manifest.json'), 'utf8'),
);
const zipName = `chesscom-lichess-export-extension-${manifest.version}.zip`;
const zipPath = resolve(root, 'dist', zipName);

execSync(
  `cd "${extDir}" && zip -r "${zipPath}" . -x "*.DS_Store"`,
  { stdio: 'inherit' },
);
console.log(`Wrote ${zipPath}`);
