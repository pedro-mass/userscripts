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

## Brave + CDP (preferred)

1. Quit Brave (Cmd+Q).
2. From **PAM root**: `./scripts/launch-brave-remote-debug.sh`  
   See [launch-brave-remote-debug.md](../../../../../scripts/launch-brave-remote-debug.md) (PAM `scripts/`).
3. Log into ChessTempo + Lichess in that Brave window; open opening training + analysis.
4. From this package:

```bash
pnpm verify:brave
# or custom URLs:
pnpm verify:brave 'https://www.chesstempo.com/opening-training/...' 'https://lichess.org/analysis'
```

Checks: `__pamCtMirrorLoaded`, **Open in Lichess** button, `window.lichess.analysis.playUci` on analysis.

Manual acceptance: **Open in Lichess** → one new ply on CT → analysis animates or updates FEN.

## Inject fallback (no Tampermonkey)

`build` writes gitignored `dist/inject.js` (body only). Plain inject **does not** provide `GM_*` — sync will not cross tabs. Use only to smoke UI mount on CT:

```bash
node scripts/verify-inject-ct.mjs '<ct opening-training url>'
```

## Unit tests

```bash
pnpm test
```

FEN diff / move detection only — not a substitute for browser proof.
