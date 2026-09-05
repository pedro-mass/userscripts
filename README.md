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

## Packages

| Package | Site | Output |
| --- | --- | --- |
| `lichess-stats` | lichess.org/training | `dist/lichess-stats.user.js` |
| `live-chart-filter` | livechart.me | `dist/live-chart-filter.user.js` |
| `udemy-section-time` | udemy.com | `dist/udemy-section-time.user.js` |
| `lattice-goal-ideal` | latticehq.com/goals | `dist/lattice-goal-ideal.user.js` |

## Add a new userscript

1. Copy `packages/lichess-stats` as a template (new folder under `packages/`).
2. Update `vite.config.ts` metadata (`match`, `name`, `version`, update URLs).
3. Add `"@userscripts/shared": "workspace:*"` if you need shared helpers.
4. Register the package in `pnpm-workspace.yaml` (already uses `packages/*`).

## Extension path

Keep privileged APIs behind `packages/shared` adapters (`storage`, `http`, etc.) so a future Chrome MV3 extension can swap implementations without rewriting DOM logic.
