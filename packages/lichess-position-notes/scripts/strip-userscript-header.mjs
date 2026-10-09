#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userPath = path.resolve(__dirname, '../dist/lichess-position-notes.user.js');
const outPath = path.resolve(__dirname, '../dist/inject.js');

const raw = fs.readFileSync(userPath, 'utf8');
const end = raw.indexOf('// ==/UserScript==');
if (end === -1) throw new Error('UserScript header not found');
const body = raw.slice(end + '// ==/UserScript=='.length).replace(/^\s+/, '');
fs.writeFileSync(outPath, body);
console.log('wrote', outPath, body.length);
