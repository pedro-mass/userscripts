#!/usr/bin/env node
/**
 * Agent-facing Brave inspection (CDP 9222). Reads DOM probe + board FEN; tails [ct-mirror] console.
 *
 * Usage:
 *   pnpm inspect:brave
 *   pnpm inspect:brave --watch   # poll every 3s
 */
import { chromium } from 'playwright';

const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const watch = process.argv.includes('--watch');
const LAUNCH_HINT =
  'Quit Brave (Cmd+Q), then: pedro-agent-manager/scripts/launch-brave-remote-debug.sh';

function readProbe(page) {
  return page.evaluate(() => {
    const raw =
      document.getElementById('pam-ct-mirror-wrap')?.getAttribute('data-pam-probe') ??
      document.getElementById('pam-ct-mirror-probe')?.textContent;
    let probe = null;
    if (raw) {
      try {
        probe = JSON.parse(raw);
      } catch {
        probe = { parseError: true, raw: raw.slice(0, 200) };
      }
    }
    let toFen = null;
    try {
      toFen = document.querySelector('chess-board')?.toFen?.() ?? null;
    } catch {
      toFen = null;
    }
    const nodeFen = window.site?.analysis?.node?.fen ?? null;
    return {
      url: location.href,
      probe,
      toFen,
      nodeFen,
      openBtn: !!document.getElementById('pam-ct-open-lichess'),
      pamMirror: new URLSearchParams(location.search).get('pamMirror'),
      pamOrient: new URLSearchParams(location.search).get('pamOrient'),
      cgOrientation: window.lichess?.chessground?.().state.orientation ?? null,
      ctFlipped: !!document.querySelector('chess-board')?.classList?.contains('flipped'),
      hasPlayUci: !!window.lichess?.analysis?.playUci,
    };
  });
}

async function collect(browser) {
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const ct = pages.find((p) => /chesstempo\.com.*opening-training/i.test(p.url()));
  const lichess = pages.filter((p) => /lichess\.org\/analysis/i.test(p.url()));

  const consoleTail = [];
  for (const p of [ct, ...lichess].filter(Boolean)) {
    p.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('[ct-mirror]') ||
        (text.includes('inject.js') && text.includes('aria-hidden'))
      ) {
        consoleTail.push({
          url: p.url().slice(0, 80),
          type: msg.type(),
          text: text.slice(0, 400),
        });
        if (consoleTail.length > 30) consoleTail.shift();
      }
    });
  }

  await new Promise((r) => setTimeout(r, watch ? 2500 : 400));

  const report = {
    ok: !!ct,
    cdp: CDP,
    tabCount: pages.length,
    ct: ct ? await readProbe(ct) : null,
    lichess: await Promise.all(lichess.map((p) => readProbe(p))),
    consoleTail,
    hint:
      'Update TM script, reload tabs. Pair: CT targetId === Lichess pamMirror query. Agent: pnpm inspect:brave',
  };

  if (report.ct?.probe && report.lichess?.length) {
    const tid = report.ct.probe.targetId;
    const paired = report.lichess.find(
      (l) => l.pamMirror === tid || l.probe?.sessionId === tid,
    );
    report.pairing = {
      ctTargetId: tid,
      lichessPamMirror: paired?.pamMirror ?? null,
      idsMatch: !!(tid && paired && paired.pamMirror === tid),
      ctFen: report.ct.probe.lastFen || report.ct.toFen,
      lichessFen: paired?.nodeFen ?? paired?.probe?.lastFen,
      ctPublishedSeq: report.ct.probe?.publishedSeq,
      ctLastAppliedSeq: report.ct.probe?.lastAppliedSeq,
      liPublishedSeq: paired?.probe?.publishedSeq,
      liLastAppliedSeq: paired?.probe?.lastAppliedSeq,
      syncGap:
        report.ct.probe?.publishedSeq != null &&
        paired?.probe?.lastAppliedSeq != null
          ? report.ct.probe.publishedSeq - paired.probe.lastAppliedSeq
          : null,
    };
  }

  return report;
}

let browser;
try {
  browser = await chromium.connectOverCDP(CDP);
} catch (e) {
  console.log(
    JSON.stringify({
      ok: false,
      err: 'cdp_connect_failed',
      cdp: CDP,
      hint: LAUNCH_HINT,
      message: String(e),
    }),
  );
  process.exit(2);
}

if (watch) {
  for (let i = 0; i < 20; i++) {
    const report = await collect(browser);
    console.log(JSON.stringify({ ...report, watchTick: i }, null, 2));
    console.log('---');
  }
} else {
  console.log(JSON.stringify(await collect(browser), null, 2));
}

await browser.close();
