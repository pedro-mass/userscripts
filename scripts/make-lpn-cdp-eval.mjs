#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const injectPath = path.resolve(
  __dirname,
  '../packages/lichess-position-notes/dist/inject.js',
);
const src = fs.readFileSync(injectPath);
const b64 = Buffer.from(src).toString('base64');
const gz = await import('node:zlib').then((z) =>
  z.gzipSync(Buffer.from(src)).toString('base64'),
);

const expr = `(async () => {
  const b64 = ${JSON.stringify(gz)};
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  const code = await new Response(stream).text();
  const s = document.createElement('script');
  s.textContent = code;
  document.head.appendChild(s);
  await new Promise((r) => setTimeout(r, 2500));
  return { ok: true, codeLen: code.length };
})()`;

fs.writeFileSync('/tmp/lpn-cdp-eval.js', expr);
console.log('bytes', Buffer.byteLength(expr));
