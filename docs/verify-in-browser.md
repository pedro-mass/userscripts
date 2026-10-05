# Verify in the browser first

## Mantra

**Extension = packaged userscript. Userscript = saved JavaScript that runs in the browser. The product is the JavaScript.**

Do not treat `pnpm build`, Tampermonkey install, or Greasy Fork publish as proof the feature works. Prove the **runtime behavior on the target site** first, then bubble up:

1. **JavaScript** — logic runs on the real page (Cursor in-app browser or Pedro’s browser).
2. **Userscript** — same code behind `@match`, metadata, and build output.
3. **Extension** — only after (1) and (2) are boringly reliable.

Skipping (1) wastes Pedro’s time on packaging bugs that are really DOM, timing, or infinite-loop bugs.

## Agent workflow (mandatory for maintained packages)

When changing behavior in `packages/*` (especially DOM, storage, network, or mount logic):

1. **Build** the package (`pnpm --filter <pkg> build`) so `dist/*.user.js` matches source.
2. **Verify on the real URL** (`@match` target). Tampermonkey does **not** run in the Cursor in-app browser — inject the built bundle:
   - **Automated (preferred):** `node scripts/verify-lichess-lpn-inject.mjs 'https://lichess.org/study/<id>/<chapter>'` (after `pnpm --filter @userscripts/lichess-position-notes build`, which writes `dist/inject.js`).
   - **In-app browser:** after `node scripts/make-lpn-cdp-chunks.mjs`, run each `/tmp/lpn-chunk-expr-*.txt` via CDP `Runtime.evaluate`, then `/tmp/lpn-cdp-final.js` with `awaitPromise: true`. (GitHub `fetch` is blocked by Lichess CSP.)
   - Private studies: headless Playwright without a saved `storageState` exits `2` with `study_not_found_guest`; use logged-in in-app browser or TM.
   - Exercise the user-visible path (Comments tab, panel mount, import click if in scope).
3. **Demo for Pedro** in the same slice: short summary, what URL you used, screenshot or snapshot of the working UI, and what to click to reproduce. “Reload Tampermonkey” is a **Pedro** step after agent proof, not a substitute for step 2.
4. **Only then** mark the slice done and commit.

If in-app injection is blocked (size, CORS, login), say so explicitly and use the smallest injected harness that still tests the changed code path — do not skip verification silently.

## What “verified” means

| Check | Required when |
| --- | --- |
| Target page **loads** (no tab hang / timeout) | Any change to observers, mount, or init |
| Changed UI **visible** in the right place | UI / layout |
| Changed data path **observable** (panel, IDB, network) | Storage / ingest / live hooks |
| Screenshot or browser snapshot in chat | Every behavior change before Pedro validates |

Node-only unit checks (`tsx`, curl PGN, etc.) support debugging but **do not** replace on-site browser verification for userscripts.

## Package notes

- **Lichess / study tools:** use a real study chapter URL, Comments tab, and logged-in session when testing WebSocket or write paths.
- **cursor-spend-pace / cursor.com:** in-app browser may differ from Pedro’s Chrome; still verify load + no runaway observers.

## See also

- [publishing.md](./publishing.md) — after browser proof
- [README.md](../README.md) — monorepo entry
- PAM `.work/plans/lichess-position-notes/` — Lichess position notes research
