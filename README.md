# userscripts

Personal browser userscripts (Tampermonkey / Violentmonkey), built as a pnpm monorepo. Each package produces its own `.user.js` file.

## Layout

```
packages/
  shared/           # shared DOM helpers (not a userscript)
  lichess-stats/    # migrated script (vite-plugin-monkey)
legacy/             # flat .user.js files pending migration
```

## Quick start

```bash
pnpm install
pnpm build                  # build all packages
pnpm dev:lichess            # HMR dev server for lichess-stats
```

Install a built script: open `packages/<name>/dist/<name>.user.js` in the browser (or use Tampermonkey's install-from-file).

## Add a new userscript

1. Copy `packages/lichess-stats` as a template (new folder under `packages/`).
2. Update `vite.config.ts` metadata (`match`, `name`, `version`, update URLs).
3. Add `"@userscripts/shared": "workspace:*"` if you need shared helpers.
4. Register the package in `pnpm-workspace.yaml` (already uses `packages/*`).

## Migration status

| Script | Status |
| --- | --- |
| lichess-stats | migrated (`packages/lichess-stats`) |
| live-chart-anime-rating-filter | legacy |
| udemy-section-time | legacy |
| lattice-goal-ideal | legacy |

## Extension path

Keep privileged APIs behind `packages/shared` adapters (`storage`, `http`, etc.) so a future Chrome MV3 extension can swap implementations without rewriting DOM logic.
