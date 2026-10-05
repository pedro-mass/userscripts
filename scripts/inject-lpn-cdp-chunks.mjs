#!/usr/bin/env node
/**
 * Print CDP Runtime.evaluate steps for in-app browser inject.
 * Agent: run each printed expression via browser_cdp, then run FINAL.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chunksDir = '/tmp';
const finalPath = '/tmp/lpn-cdp-final.js';

const parts = fs
  .readdirSync(chunksDir)
  .filter((f) => /^lpn-chunk-expr-\d+\.txt$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (!parts.length) {
  console.error('Run: node scripts/make-lpn-cdp-chunks.mjs after build');
  process.exit(1);
}
for (const f of parts) {
  const expr = fs.readFileSync(path.join(chunksDir, f), 'utf8');
  console.log(`--- ${f} (${expr.length} chars) ---`);
  console.log(expr);
}
console.log('--- FINAL ---');
console.log(fs.readFileSync(finalPath, 'utf8'));
