# Publishing userscripts

**Active scripts:** [live-chart-filter](../packages/live-chart-filter/) (LiveChart.me) and [chesscom-lichess-export](../packages/chesscom-lichess-export/) (Chess.com → Lichess).

## Greasy Fork CLI (repeatable)

Script: [`scripts/greasyfork/publish.mjs`](../scripts/greasyfork/publish.mjs) (Playwright + saved session).

**One-time setup**

```bash
pnpm install
pnpm exec playwright install chromium
pnpm greasyfork:login    # sign in once; saves .greasyfork/storage-state.json (gitignored)
```

**Per package** — add `packages/<name>/greasyfork.json`:

```json
{
  "scriptId": 594491,
  "distFile": "chesscom-lichess-export.user.js",
  "additionalInfo": "greasyfork.additional-info.md"
}
```

- `scriptId` — set after first publish (or use `--write-script-id`).
- `distFile` — basename under `dist/`.
- `additionalInfo` — optional markdown for the GF listing page.

**Commands**

| Command | When |
| --- | --- |
| `pnpm greasyfork:publish <pkg> --build --write-script-id` | First GF listing (posts code, sets GitHub sync URL) |
| `pnpm greasyfork:sync <pkg>` | Pull latest `dist/` from `main` into an existing listing |

Sync URL is always:

`https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/<pkg>/dist/<distFile>`

Flags: `--build` (run package build first), `--headed` (show browser), `--write-script-id` (patch `greasyfork.json` after first publish).

## Strategy

| Layer | Role |
| --- | --- |
| **GitHub** (`pedro-mass/userscripts`) | Source of truth, version history, issues |
| **Greasy Fork** | Public install and discovery for LiveChart filter |
| **userscript.zone** | Search index (no registration). Indexes Greasy Fork listings |

## LiveChart on Greasy Fork

| | |
| --- | --- |
| **Listing** | [547862 - LiveChart.me Minimum Rating Filter](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent) |
| **Sync URL** | `https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/live-chart-filter/dist/live-chart-filter.user.js` |
| **Profile** | [pedro-mass](https://greasyfork.org/en/users/111366-pedro-mass) |

### Update sync URL (one-time after monorepo move)

If the listing still points at a repo-root `.user.js` file:

1. Log in to [Greasy Fork](https://greasyfork.org/).
2. Open [script 547862](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent) → **Manage**.
3. Set sync URL to the **raw** link above (not a `github.com/.../blob/...` URL).
4. **Sync now** → confirm **Code** tab shows v1.8+ from `packages/live-chart-filter/`.

## Chess.com → Lichess (chesscom-lichess-export)

| | |
| --- | --- |
| **Package** | `packages/chesscom-lichess-export/` |
| **Listing** | [594491 - Chess.com → Lichess Export](https://greasyfork.org/en/scripts/594491-chess-com-lichess-export) |
| **Sync URL** | `https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/dist/chesscom-lichess-export.user.js` |
| **Auto-update** | GF install, or `@updateURL` on raw GitHub installs |

### Release workflow

1. Edit `packages/chesscom-lichess-export/src/`.
2. Bump `version` in `vite.config.ts` and `package.json`.
3. `pnpm build:chesscom`, commit `dist/`, push to `main`.
4. `pnpm greasyfork:sync chesscom-lichess-export` (or webhook / daily poll).
5. Tampermonkey updates from Greasy Fork on the next check.

## Release workflow (live-chart-filter)

1. Edit `packages/live-chart-filter/src/`.
2. Bump `version` in `vite.config.ts` and `package.json`.
3. Build and commit:

    ```bash
    pnpm build
    git add packages/live-chart-filter/dist/
    git commit -m "feat(live-chart-filter): <summary>"
    git push
    ```

4. `pnpm greasyfork:sync live-chart-filter` after push (or webhook / daily poll).
5. Installs from Greasy Fork update through GF; raw GitHub installs use `@updateURL` in the built header.

## Greasy Fork rules

From [code rules](https://greasyfork.org/en/help/code-rules):

- No minified or obfuscated code (`minify: false` in vite-plugin-monkey).
- Primary logic in the synced file (no remote loader stub).
- Bump `@version` on every publish.
- Honest `@description` and `@match` for livechart.me only.

Optional metadata in `vite.config.ts`: `homepageURL`, `supportURL` → GitHub repo/issues.

## GitHub webhook (optional)

Set this up **after** the Greasy Fork sync URL points at `packages/live-chart-filter/dist/live-chart-filter.user.js`.

Without a webhook, Greasy Fork may poll about once per day. With a webhook, pushes update the listing within minutes.

### Setup

1. Greasy Fork: [webhook info](https://greasyfork.org/en/users/webhook-info) → copy payload URL and secret.
2. GitHub `pedro-mass/userscripts` → **Settings** → **Webhooks** → **Add webhook**:
   - Content type: `application/json`
   - Secret: from Greasy Fork
   - Events: **push** only
3. Test: bump version, `pnpm build`, commit `dist/`, push → check webhook **Recent deliveries** for `200`.

The dist file must already exist on `main` and be **modified** on the test push (not only added). See [GF webhook discussion](https://greasyfork.org/en/discussions/greasyfork/204541-why-is-my-webhook-update-not-working).

## Archived scripts on Greasy Fork

These repo packages are **no longer maintained**. Consider marking the Greasy Fork listings as unmaintained or removing sync URLs so users are not offered stale updates:

| Package | GF listing |
| --- | --- |
| lichess-stats | [522313](https://greasyfork.org/en/scripts/522313-lichess-training-stats-for-current-run) |
| udemy-section-time | [28295](https://greasyfork.org/en/scripts/28295-udemy-show-section-time) |
| lattice-goal-ideal | [profile](https://greasyfork.org/en/users/111366-pedro-mass) |

Greasy Fork does not require you to delete listings; updating the description to say "unmaintained" helps installers.

## Install paths

| Path | Who uses it |
| --- | --- |
| Greasy Fork → Install | Primary discovery |
| Raw `dist/live-chart-filter.user.js` | Dev / `@downloadURL` |
| Raw `dist/chesscom-lichess-export.user.js` | Chess.com → Lichess dev / `@downloadURL` |
| userscript.zone | Search only; links to GF |

## Related

- [../README.md](../README.md)
- [Greasy Fork installing scripts](https://greasyfork.org/en/help/installing-user-scripts)
- [Greasy Fork code rules](https://greasyfork.org/en/help/code-rules)
