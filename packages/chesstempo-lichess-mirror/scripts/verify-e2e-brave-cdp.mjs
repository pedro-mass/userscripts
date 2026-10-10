#!/usr/bin/env node
/**
 * E2E: Open in Lichess → play d4 on CT → Lichess follows (Brave + Tampermonkey).
 */
import { chromium } from 'playwright';
import { cleanupMirrorTabs } from './brave-cdp-cleanup.mjs';

const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';

function pieceSideKey(fen) {
  const p = fen.trim().split(/\s+/);
  return `${p[0]} ${p[1]}`;
}

function readProbe(page) {
  return page.evaluate(() => {
    const wrap = document.getElementById('pam-ct-mirror-wrap');
    for (const n of Array.from(wrap?.childNodes || [])) {
      if (n.nodeType !== 8) continue;
      const i = n.data.indexOf('{');
      if (i >= 0) {
        try {
          return JSON.parse(n.data.slice(i));
        } catch {
          return null;
        }
      }
    }
    return null;
  });
}

function readNodeFen(page) {
  return page.evaluate(() => window.site?.analysis?.node?.fen ?? null);
}

function readCgOrientation(page) {
  return page.evaluate(
    () => window.lichess?.chessground?.().state.orientation ?? null,
  );
}

function readCtFen(page) {
  return page.evaluate(() => {
    try {
      return document.querySelector('chess-board')?.toFen?.() ?? null;
    } catch {
      return null;
    }
  });
}

async function playCtMove(page, from, to) {
  const fromSq = page.locator(`[data-square-id="${from}"]`).first();
  const piece = fromSq.locator('.ct-pieceClass').first();
  if (await piece.count()) {
    await piece.click({ force: true, timeout: 15_000 });
  } else {
    await fromSq.click({ force: true, timeout: 15_000 });
  }
  await page.waitForTimeout(150);
  await page
    .locator(`[data-square-id="${to}"]`)
    .first()
    .click({ force: true, timeout: 15_000 });
}

let browser;
let cleanupBefore = null;
let cleanupAfter = null;
try {
  browser = await chromium.connectOverCDP(CDP);
} catch (e) {
  console.log(JSON.stringify({ ok: false, err: 'cdp_connect_failed', message: String(e) }));
  process.exit(2);
}

const ctx = browser.contexts()[0];
cleanupBefore = await cleanupMirrorTabs(ctx);

const ctUrl =
  process.argv[2] ??
  'https://chesstempo.com/opening-training/repertoire/d4-dynamite-2026.10.08';

let ct = ctx.pages().find((p) => p.url().includes('opening-training'));
if (!ct) {
  ct = await ctx.newPage();
  await ct.goto(ctUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
} else if (!ct.url().includes('opening-training')) {
  await ct.goto(ctUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
}

await ct.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
await ct.waitForSelector('#pam-ct-open-lichess', { timeout: 60_000 });
await ct.waitForTimeout(2000);
const beforeCt = await readCtFen(ct);

const liLogs = [];
const attachLiLogs = (page) => {
  page.on('console', (m) => {
    if (m.text().includes('[ct-mirror]')) liLogs.push(m.text().slice(0, 200));
  });
};

await ct.locator('#pam-ct-open-lichess').click();
await ct.waitForTimeout(2500);

let li = null;
for (let i = 0; i < 30; i++) {
  li = ctx.pages().find(
    (p) =>
      p.url().includes('lichess.org/analysis') && p.url().includes('pamMirror='),
  );
  if (li) break;
  await ct.waitForTimeout(500);
}

if (!li) {
  cleanupAfter = await cleanupMirrorTabs(ctx);
  console.log(
    JSON.stringify({ ok: false, err: 'no_lichess_tab', cleanupBefore, cleanupAfter }),
  );
  try {
    await browser.close();
  } catch {
    /* ok */
  }
  process.exit(1);
}

attachLiLogs(li);

await li.waitForFunction(() => !!window.lichess?.analysis?.playUci, null, {
  timeout: 60_000,
});
await li.waitForTimeout(1500);

const liFenOpen = await readNodeFen(li);

let ctFen = await readCtFen(ct);
if (ctFen && pieceSideKey(ctFen).includes('PPPPPPPP/RNBQKBNR w')) {
  await playCtMove(ct, 'd2', 'd4');
  await ct.waitForTimeout(800);
  ctFen = await readCtFen(ct);
}

const expectedOrient =
  new URL(li.url()).searchParams.get('pamOrient') === 'black'
    ? 'black'
    : 'white';

let synced = false;
let lastLiFen = liFenOpen;
let liOrientation = await readCgOrientation(li);
if (ctFen && pieceSideKey(ctFen).includes('3P4') && ctFen.includes(' b ')) {
  await playCtMove(ct, 'd7', 'd5');
  await ct.waitForTimeout(1000);
  ctFen = await readCtFen(ct);
  for (let i = 0; i < 30; i++) {
    lastLiFen = await readNodeFen(li);
    liOrientation = await readCgOrientation(li);
    if (
      ctFen &&
      lastLiFen &&
      pieceSideKey(ctFen) === pieceSideKey(lastLiFen) &&
      liOrientation === expectedOrient
    ) {
      synced = true;
      break;
    }
    await ct.waitForTimeout(400);
  }
} else {
  for (let i = 0; i < 25; i++) {
    lastLiFen = await readNodeFen(li);
    liOrientation = await readCgOrientation(li);
    if (
      ctFen &&
      lastLiFen &&
      pieceSideKey(ctFen) === pieceSideKey(lastLiFen) &&
      liOrientation === expectedOrient
    ) {
      synced = true;
      break;
    }
    await ct.waitForTimeout(400);
  }
}

const finalCtProbe = await readProbe(ct);
const finalLiProbe = await readProbe(li);

cleanupAfter = await cleanupMirrorTabs(ctx);

const report = {
  ok: synced,
  scriptVersion: finalCtProbe?.scriptVersion ?? null,
  beforeCt,
  ctFen,
  liFenOpen,
  liFenFinal: lastLiFen,
  orientation: {
    expected: expectedOrient,
    final: liOrientation,
    ok: liOrientation === expectedOrient,
  },
  pairing: {
    ctTarget: finalCtProbe?.targetId,
    liPam: new URL(li.url()).searchParams.get('pamMirror'),
    ctPublishedSeq: finalCtProbe?.publishedSeq,
    liTargetId: finalLiProbe?.targetId,
    liLastAppliedSeq: finalLiProbe?.lastAppliedSeq,
    liPublishedSeq: finalLiProbe?.publishedSeq,
    syncGap:
      finalCtProbe?.publishedSeq != null && finalLiProbe?.lastAppliedSeq != null
        ? finalCtProbe.publishedSeq - finalLiProbe.lastAppliedSeq
        : null,
  },
  lichessUrl: li.url().slice(0, 120),
  liMirrorLogs: liLogs.slice(-12),
  cleanupBefore,
  cleanupAfter,
};

console.log(JSON.stringify(report, null, 2));
try {
  await browser.close();
} catch {
  /* ok */
}
process.exit(synced ? 0 : 1);
