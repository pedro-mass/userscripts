# Verify CT → Lichess mirror (browser)

All verify tooling for this package lives under **`packages/chesstempo-lichess-mirror/`** (`scripts/`, this doc).

Global mantra: [repos/userscripts/docs/verify-in-browser.md](../../../../docs/verify-in-browser.md).

## Prereq

```bash
cd repos/userscripts
pnpm install
pnpm --filter @userscripts/chesstempo-lichess-mirror build
```

Install `dist/chesstempo-lichess-mirror.user.js` in Tampermonkey (CT + Lichess matches).

**0.1.12+** Lichess `playUci` runs in the page main world via `GM_addElement` (TM isolated world cannot see `window.lichess`). Reinstall in TM after grant changes.

**Agent / CDP update to latest build** (Brave on 9222):

```bash
pnpm build
pnpm tm:serve    # terminal 1 — serves dist on :8765
# In Brave, open http://127.0.0.1:8765/chesstempo-lichess-mirror.user.js → TM update UI
pnpm tm:update   # clicks input[value=Update] on ask.html via CDP
pnpm cleanup:brave   # close stray Lichess mirror / TM install / about:blank tabs (run between test loops)
```

`pnpm tm:update` reuses an existing clutter or `about:blank` tab for the install URL when possible, then cleanup closes TM `ask.html`, install pages, and blank tabs left by CDP `newPage()`.

## Brave + CDP (preferred)

1. Quit Brave (Cmd+Q).
2. From **PAM root**: `./scripts/launch-brave-remote-debug.sh`  
   See [launch-brave-remote-debug.md](../../../../../scripts/launch-brave-remote-debug.md) (PAM `scripts/`).
3. Log into ChessTempo + Lichess in that Brave window; open opening training + analysis.
4. From this package:

```bash
pnpm inspect:brave        # full snapshot for agents (CDP → DOM probe #pam-ct-mirror-probe)
pnpm inspect:brave --watch

pnpm verify:brave
# or custom URLs:
pnpm verify:brave 'https://www.chesstempo.com/opening-training/...' 'https://lichess.org/analysis'
```

Checks: `__pamCtMirrorLoaded`, **Open in Lichess** button, `window.lichess.analysis.playUci` on analysis.

Manual acceptance: **Open in Lichess** → one new ply on CT → analysis animates or updates FEN.

## Console noise on CT

**`aria-hidden` / `inject.js`:** On Brave, stack usually points at **Video Speed Controller** (`chrome-extension://nffaoalbilbmmfgbnbgppjihopabppdk/inject.js`), not Tampermonkey. That extension runs a main-world `MutationObserver` on `aria-hidden`; ChessTempo’s board tears down nodes on each ply and the observer can read a detached parent → `Cannot read properties of null (reading 'aria-hidden')`. ChessTempo re-logs it as `cta error`. **Mitigation:** disable Video Speed Controller on `chesstempo.com` (or while training). Not caused by mirror sync logic in 0.1.12+.

Older mirror builds made this worse by mutating `<html>` probe attributes; **0.1.6+** uses `#pam-ct-mirror-wrap` + comment probe only.

**Other red lines:** CT often logs `router prefix` / `this._moveList` as `console.error` — site noise, not the userscript.

**Lichess:** With 0.1.12 page bridge, verify runs typically show **no** mirror-related console errors.

## Debug logging

Before 0.1.2, logging was minimal — hard to diagnose “no position” / no sync.

1. On CT or Lichess, DevTools console: `localStorage.pamCtMirrorDebug = '1'` then reload both tabs.
2. Filter console by `[ct-mirror]`.
3. Click **Open in Lichess** — expect `Open in Lichess click` with `toFen` / `explorerHook`.
4. Optional ring buffer in Tampermonkey storage: key `ctLichessMirror.recentLog` (last ~40 entries when debug on).

Turn off: `localStorage.removeItem('pamCtMirrorDebug')`.

## Mirror button icon (try variants)

On ChessTempo, DevTools console:

```js
// flip | external | sync | split | arrow
localStorage.pamCtMirrorIcon = 'sync';
location.reload();
```

Reset: `localStorage.removeItem('pamCtMirrorIcon')`.

## Inject fallback (no Tampermonkey)

`build` writes gitignored `dist/inject.js` (body only). Plain inject **does not** provide `GM_*` — sync will not cross tabs.

ChessTempo **CSP blocks** Playwright `addScriptTag` on opening training — expect failure. **Use Brave + Tampermonkey** for real verify; inject path is not supported on CT.

## Unit tests

```bash
pnpm test
```

FEN diff / move detection only — not a substitute for browser proof.
