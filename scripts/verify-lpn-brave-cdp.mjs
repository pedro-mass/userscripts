#!/usr/bin/env node
/** Attach to Brave on CDP 9222 and check LPN + login (uses local playwright). */
import { chromium } from 'playwright';

const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const studyUrl =
  process.argv[2] ?? 'https://lichess.org/study/oDP5q102/8Wjgh8Nh';

let browser;
try {
  browser = await chromium.connectOverCDP(CDP);
} catch (e) {
  console.error(
    JSON.stringify({
      ok: false,
      err: 'cdp_connect_failed',
      cdp: CDP,
      hint:
        'Quit Brave (Cmd+Q), then: pedro-agent-manager/.work/scripts/launch-brave-remote-debug.sh',
      message: String(e),
    }),
  );
  process.exit(2);
}

const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes('lichess.org')) ?? ctx.pages()[0];

if (!page.url().includes('lichess.org/study')) {
  await page.goto(studyUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
}

const commentsTab = page.getByRole('button', { name: /comment/i });
if (await commentsTab.count()) {
  await commentsTab.first().click({ timeout: 5000 }).catch(() => {});
}
await page.waitForTimeout(2000);

const probe = await page.evaluate(() => {
  const panel = document.getElementById('lpn-position-notes-panel');
  const comments = document.querySelector('.study__comments');
  return {
    signIn: !!document.querySelector('a[href*="/login"]'),
    headerUser:
      document.querySelector('header a[href*="/@/"]')?.textContent?.trim() ??
      null,
    panel: !!panel,
    lpnLoaded: !!window.__lpnLoaded,
    gmScript:
      typeof GM_info !== 'undefined' ? GM_info?.script?.name ?? null : null,
    studyComments: !!comments,
    placed:
      !!panel &&
      !!comments &&
      (comments.nextElementSibling === panel ||
        comments.parentElement?.contains(panel)),
  };
});

console.log(JSON.stringify({ ok: true, url: page.url(), ...probe }, null, 2));
await browser.close();
