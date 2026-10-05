# Lichess position notes — verification

**Product proof:** Brave (or Chrome) + Tampermonkey on a real study chapter. Agent-only paths below are for when TM is unavailable.

Prerequisite for inject-based checks:

```bash
pnpm --filter @userscripts/lichess-position-notes build
```

(`build` writes `packages/lichess-position-notes/dist/inject.js` locally; that file is gitignored.)

## Scripts

| Goal | Command |
| --- | --- |
| **Tampermonkey smoke (preferred)** | Launch Brave with remote debugging (see PAM `.work/scripts/launch-brave-remote-debug.sh`), install/update the userscript, then `node scripts/verify-lpn-brave-cdp.mjs 'https://lichess.org/study/<id>/<chapter>'` |
| **Headless Playwright inject** | `node scripts/verify-lichess-lpn-inject.mjs '<chapter url>'` — guest may hit private studies (`study_not_found_guest`) |
| **CDP: inject full bundle** | `CDP_URL=ws://127.0.0.1:9222/devtools/browser/... node scripts/inject-lpn-via-cdp-url.mjs` |
| **CDP: gzip chunk inject (large / in-app browser)** | `node scripts/make-lpn-cdp-chunks.mjs` then `CDP_URL=ws://... node scripts/inject-lpn-glass-cdp.mjs` |

Unit tests (display logic only): `pnpm --filter @userscripts/lichess-position-notes test`.

See also [verify-in-browser.md](./verify-in-browser.md) and [packages/lichess-position-notes/README.md](../packages/lichess-position-notes/README.md).
