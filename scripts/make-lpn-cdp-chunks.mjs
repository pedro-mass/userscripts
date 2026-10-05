#!/usr/bin/env node
/** Writes /tmp/lpn-chunk-expr-*.txt and /tmp/lpn-cdp-final.js for in-app CDP inject. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const injectPath = path.resolve(
  __dirname,
  '../packages/lichess-position-notes/dist/inject.js',
);
const src = fs.readFileSync(injectPath);
const gz = zlib.gzipSync(src).toString('base64');
const partLen = 8000;
for (let i = 0, n = 0; i < gz.length; i += partLen, n++) {
  const p = gz.slice(i, i + partLen);
  const expr = `(window.__lpnGzB64=(window.__lpnGzB64||"")+${JSON.stringify(p)},"p${n}")`;
  fs.writeFileSync(`/tmp/lpn-chunk-expr-${n}.txt`, expr);
}
const final = `(() => {
  const b64 = window.__lpnGzB64;
  delete window.__lpnGzB64;
  if (!b64) return { ok: false, err: 'no b64' };
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text().then((code) => {
    const s = document.createElement('script');
    s.textContent = code;
    document.head.appendChild(s);
    return new Promise((r) => setTimeout(r, 4500)).then(() => ({
      ok: true,
      codeLen: code.length,
      panel: Boolean(document.getElementById('lpn-position-notes-panel')),
      placed: (() => {
        const panel = document.getElementById('lpn-position-notes-panel');
        const comments = document.querySelector('.analyse__underboard .study__comments');
        return Boolean(panel && comments && panel.previousElementSibling === comments);
      })(),
      url: location.href,
    }));
  });
})()`;
fs.writeFileSync('/tmp/lpn-cdp-final.js', final);
console.log(JSON.stringify({ parts: Math.ceil(gz.length / partLen), gzLen: gz.length }));
