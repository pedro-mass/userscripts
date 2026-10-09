# Verify Lichess position notes (browser)

All verify tooling lives under **`packages/lichess-position-notes/`** (`scripts/`, this doc).

Global mantra: [repos/userscripts/docs/verify-in-browser.md](../../../../docs/verify-in-browser.md).

## Prereq

```bash
cd repos/userscripts
pnpm install
pnpm --filter @userscripts/lichess-position-notes build
```

(`build` writes gitignored `dist/inject.js`.)

Install `dist/lichess-position-notes.user.js` in Tampermonkey for real proof.

## Brave + CDP (preferred)

1. Quit Brave (Cmd+Q).
2. PAM: `./scripts/launch-brave-remote-debug.sh` — [launch-brave-remote-debug.md](../../../../../scripts/launch-brave-remote-debug.md).
3. From this package:

```bash
pnpm verify:brave
pnpm verify:brave 'https://lichess.org/study/<id>/<chapter>'
```

## Other paths

| Goal | Command |
| --- | --- |
| Headless inject | `pnpm verify:inject '<chapter url>'` |
| CDP full inject | `CDP_URL=ws://... pnpm verify:cdp-inject` |
| CDP gzip chunks (glass browser) | `pnpm verify:cdp-chunks` then `CDP_URL=ws://... pnpm verify:cdp-glass` |
| Store screenshots | `pnpm capture:store` |

## Unit tests

```bash
pnpm test
```
