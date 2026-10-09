#!/usr/bin/env node
/**
 * Attach to Brave on CDP (Tampermonkey must have the mirror userscript enabled).
 * Usage: pnpm verify:brave [ctOpeningUrl] [lichessAnalysisUrl]
 */
import { chromium } from 'playwright';

const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const ctUrl =
  process.argv[2] ?? 'https://www.chesstempo.com/opening-training/';
const analysisUrl =
  process.argv[3] ?? 'https://lichess.org/analysis';

const LAUNCH_HINT =
  'Quit Brave (Cmd+Q), then: pedro-agent-manager/scripts/launch-brave-remote-debug.sh';

let browser;
try {
  browser = await chromium.connectOverCDP(CDP);
} catch (e) {
  console.error(
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

const ctx = browser.contexts()[0];
const pages = () => ctx.pages();

async function ensurePage(match, url) {
  let page = pages().find((p) => match(p.url()));
  if (!page) {
    page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  } else if (!match(page.url())) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  }
  return page;
}

const ctPage = await ensurePage(
  (u) => u.includes('chesstempo.com') && u.includes('opening-training'),
  ctUrl,
);
await ctPage.waitForTimeout(3000);

const ctProbe = await ctPage.evaluate(() => {
  const board = document.querySelector('chess-board');
  let boardFen = null;
  try {
    boardFen = board?.toFen?.() ?? null;
  } catch {
    boardFen = null;
  }
  const explorer = document.querySelector('opening-explorer');
  return {
    url: location.href,
    mirrorLoaded: !!window.__pamCtMirrorLoaded,
    openBtn: !!document.getElementById('pam-ct-open-lichess'),
    openingExplorer: !!explorer,
    explorerHooked: explorer?.dataset?.pamMirrorPageHook === '1',
    chessBoardFen: boardFen,
    gmScript:
      typeof GM_info !== 'undefined' ? GM_info?.script?.name ?? null : null,
  };
});

const liPage = await ensurePage(
  (u) => u.includes('lichess.org/analysis'),
  analysisUrl,
);
await liPage.waitForTimeout(2000);

const liProbe = await liPage.evaluate(() => ({
  url: location.href,
  mirrorLoaded: !!window.__pamCtMirrorLoaded,
  pamMirror: new URLSearchParams(location.search).get('pamMirror'),
  hasAnalysisApi: !!window.lichess?.analysis?.playUci,
  gmScript:
    typeof GM_info !== 'undefined' ? GM_info?.script?.name ?? null : null,
}));

// TM may run in an isolated world: DOM probes (openBtn) are reliable; window.__pamCtMirrorLoaded may be undefined in CDP evaluate.
const ok =
  ctProbe.openBtn &&
  ctProbe.openingExplorer &&
  liProbe.hasAnalysisApi;

console.log(
  JSON.stringify(
    {
      ok,
      cdp: CDP,
      ct: ctProbe,
      lichess: liProbe,
      hint: ok
        ? 'Click Open in Lichess on CT; navigate one ply; watch analysis board.'
        : 'Enable userscript in Tampermonkey on both hosts, reload tabs.',
    },
    null,
    2,
  ),
);

await browser.close();
process.exit(ok ? 0 : 1);
