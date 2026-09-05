# Publishing userscripts

How this repo reaches users: GitHub is the source of truth; [Greasy Fork](https://greasyfork.org/) is the public discovery layer.

## Strategy

| Layer | Role |
| --- | --- |
| **GitHub** (`pedro-mass/userscripts`) | Authoring, version history, issues, raw install URLs |
| **Greasy Fork** | Search, install counts, site-specific listings, Tampermonkey discovery |
| **userscript.zone** | Search index only (no registration). Tampermonkey "scripts for this site" indexes moderated hosts like Greasy Fork |

We do **not** mirror every script to OpenUserJS or ScriptCat unless there is a specific audience reason.

## Greasy Fork listings

Profile: [greasyfork.org/en/users/111366-pedro-mass](https://greasyfork.org/en/users/111366-pedro-mass)

| Package | Greasy Fork page | Raw sync URL (monorepo) |
| --- | --- | --- |
| `lichess-stats` | [522313](https://greasyfork.org/en/scripts/522313-lichess-training-stats-for-current-run) | `https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lichess-stats/dist/lichess-stats.user.js` |
| `live-chart-filter` | [547862](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent) | `https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/live-chart-filter/dist/live-chart-filter.user.js` |
| `udemy-section-time` | [28295](https://greasyfork.org/en/scripts/28295-udemy-show-section-time) | `https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/udemy-section-time/dist/udemy-section-time.user.js` |
| `lattice-goal-ideal` | [profile listing](https://greasyfork.org/en/users/111366-pedro-mass) | `https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lattice-goal-ideal/dist/lattice-goal-ideal.user.js` |

After the monorepo migration, **update each Greasy Fork script's sync URL** to the matching `packages/*/dist/*.user.js` path (see [Update a Greasy Fork sync URL](#update-a-greasy-fork-sync-url)).

## Release workflow

1. Implement in `packages/<slug>/src/`.
2. Bump `version` in `vite.config.ts` (and `package.json` if you keep them aligned).
3. Build and commit dist artifacts:

    ```bash
    pnpm --filter @userscripts/<slug> build
    git add packages/<slug>/dist/
    git commit -m "feat(<slug>): <summary>"
    git push
    ```

4. Greasy Fork picks up the change (webhook or daily poll; see below).
5. Users who installed from Greasy Fork get updates through Greasy Fork. Users who installed from raw GitHub use `@updateURL` in the built header.

### New script checklist

1. Scaffold package (copy `packages/lichess-stats/`).
2. Set `vite.config.ts` metadata: `@match`, `@description`, `namespace`, `updateURL`, `downloadURL`.
3. Build; push to `main`.
4. On Greasy Fork: **Post script** (first time) or add sync URL to an existing listing.
5. Add row to the table in this doc and in root `README.md`.

## Greasy Fork rules (relevant to this repo)

From [Greasy Fork code rules](https://greasyfork.org/en/help/code-rules):

- **No minified or obfuscated code.** vite-plugin-monkey defaults to `minify: false`; keep it that way for Greasy Fork builds.
- **Primary logic must be in the synced file.** Do not publish a stub that loads the real script from elsewhere.
- **Max 2 MB** per script.
- **Bump `@version`** on every publish Greasy Fork should accept.
- Use honest `@description` and `@match` only for sites the script enhances.

Optional metadata in `vite.config.ts`:

- `homepageURL` → GitHub package folder or repo
- `supportURL` → `https://github.com/pedro-mass/userscripts/issues`

## Update a Greasy Fork sync URL

Do this once per script after moving to the monorepo (old listings may still point at repo-root `.user.js` files).

1. Log in to [Greasy Fork](https://greasyfork.org/).
2. Open the script page → **Manage** (or **Admin**).
3. Find **Sync from external source** / source URL settings.
4. Paste the **raw** GitHub URL to `packages/<slug>/dist/<slug>.user.js` (not the GitHub blob UI link).
5. Save. Use **Sync now** if the UI offers it.
6. Confirm the **Code** tab shows the new version and monorepo paths in comments if applicable.

**Common failures**

- Used `github.com/.../blob/...` instead of `raw.githubusercontent.com/...`
- File extension or path wrong (must be a valid userscript)
- Forgot to bump `@version` before pushing

## GitHub webhook (optional, faster sync)

Without a webhook, Greasy Fork may only check synced scripts about once per day. A webhook updates listings shortly after `git push`.

### One-time setup (repo level)

1. On Greasy Fork: open [webhook info](https://greasyfork.org/en/users/webhook-info) while logged in.
2. Copy your **payload URL** and **secret**.
3. On GitHub: `pedro-mass/userscripts` → **Settings** → **Webhooks** → **Add webhook**.
4. Set:
   - **Payload URL:** from Greasy Fork
   - **Content type:** `application/json`
   - **Secret:** from Greasy Fork
   - **Events:** Just the `push` event
5. Save. Push a commit that **modifies** an already-synced `dist/*.user.js` (not only adds a new file) and check **Recent deliveries** for `200`.

### Per-script setup

Each Greasy Fork listing must already have its **sync URL** set to the raw `dist/*.user.js` path. The webhook then refreshes any synced scripts in that repo on push.

**Note:** If your workflow only **adds** a new dist file on first publish, Greasy Fork may not see a "modified" file on that push. Prefer committing an empty placeholder `.user.js` first, then overwriting on later builds (see [GF discussion on webhooks](https://greasyfork.org/en/discussions/greasyfork/204541-why-is-my-webhook-update-not-working)).

## Install paths users see

| Path | Who uses it |
| --- | --- |
| Greasy Fork script page → Install | Most discoverability; updates via GF |
| Raw `dist/*.user.js` on GitHub | Power users, dev, `@downloadURL` |
| Tampermonkey → Install from URL | Same as raw GitHub |
| userscript.zone | Search only; lands on GF or other indexed host |

## userscript.zone

No account or registration. Listings appear when your script is hosted on a moderated source (Greasy Fork qualifies). Tampermonkey's dashboard uses this index for "scripts available for this site."

## When to add other hosts

| Host | Consider if |
| --- | --- |
| **OpenUserJS** | You want a second listing and accept duplicate maintenance |
| **ScriptCat** | You care about the ScriptCat store / China-heavy audience |
| **Chrome Web Store** | You graduate from userscript to MV3 extension |

## Related

- Monorepo layout: [../README.md](../README.md)
- Greasy Fork help: [installing user scripts](https://greasyfork.org/en/help/installing-user-scripts), [code rules](https://greasyfork.org/en/help/code-rules), [rewriting](https://greasyfork.org/en/help/rewriting)
