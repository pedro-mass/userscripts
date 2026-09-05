# userscripts

Personal browser userscripts (Tampermonkey / Violentmonkey), built as a pnpm monorepo. Each package produces its own `.user.js` file.

## Layout

```
packages/
  shared/              # shared DOM helpers (not a userscript)
  lichess-stats/
  live-chart-filter/
  udemy-section-time/
  lattice-goal-ideal/
legacy/                # archived flat sources (superseded)
```

## Quick start

```bash
pnpm install
pnpm build                  # build all packages
pnpm dev:lichess            # HMR dev server (any package: dev:<name>)
```

Install a built script: open `packages/<name>/dist/<name>.user.js` in the browser (or use Tampermonkey's install-from-file).

**Publishing:** see [docs/publishing.md](docs/publishing.md). Greasy Fork profile: [pedro-mass](https://greasyfork.org/en/users/111366-pedro-mass).

## Packages

| Package | Site | Greasy Fork | Output |
| --- | --- | --- | --- |
| `lichess-stats` | lichess.org/training | [522313](https://greasyfork.org/en/scripts/522313-lichess-training-stats-for-current-run) | `dist/lichess-stats.user.js` |
| `live-chart-filter` | livechart.me | [547862](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent) | `dist/live-chart-filter.user.js` |
| `udemy-section-time` | udemy.com | [28295](https://greasyfork.org/en/scripts/28295-udemy-show-section-time) | `dist/udemy-section-time.user.js` |
| `lattice-goal-ideal` | latticehq.com/goals | [profile](https://greasyfork.org/en/users/111366-pedro-mass) | `dist/lattice-goal-ideal.user.js` |

## Add a new userscript

1. Copy `packages/lichess-stats` as a template (new folder under `packages/`).
2. Update `vite.config.ts` metadata (`match`, `name`, `version`, update URLs).
3. Add `"@userscripts/shared": "workspace:*"` if you need shared helpers.
4. Register the package in `pnpm-workspace.yaml` (already uses `packages/*`).

## Extension path

Keep privileged APIs behind `packages/shared` adapters (`storage`, `http`, etc.) so a future Chrome MV3 extension can swap implementations without rewriting DOM logic.
