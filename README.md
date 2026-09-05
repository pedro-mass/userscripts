# userscripts

Personal browser userscripts (Tampermonkey / Violentmonkey), built as a pnpm monorepo.

**Actively maintained:** [LiveChart.me minimum rating filter](packages/live-chart-filter/) and [Chess.com → Lichess export](packages/chesscom-lichess-export/). Other packages are archived in-repo and no longer supported.

## Layout

```
packages/
  live-chart-filter/          # maintained
  chesscom-lichess-export/    # maintained
  shared/                     # shared DOM helpers
  lichess-stats/       # archived (unsupported)
  udemy-section-time/  # archived (unsupported)
  lattice-goal-ideal/  # archived (unsupported)
legacy/                # pre-monorepo flat sources
```

## Quick start

```bash
pnpm install
pnpm build              # live-chart-filter
pnpm build:chesscom     # chess.com → lichess
```

| Package | Install |
| --- | --- |
| LiveChart filter | [Greasy Fork 547862](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent) or `packages/live-chart-filter/dist/live-chart-filter.user.js` |
| Chess.com → Lichess | [Greasy Fork 594491](https://greasyfork.org/en/scripts/594491-chess-com-lichess-export) or `packages/chesscom-lichess-export/dist/chesscom-lichess-export.user.js` |

Dev: `pnpm dev` (LiveChart) · `pnpm dev:chesscom`

**Publishing:** [docs/publishing.md](docs/publishing.md)

## Maintained packages

| Package | Site | Greasy Fork | Output |
| --- | --- | --- | --- |
| `live-chart-filter` | livechart.me | [547862](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent) | `dist/live-chart-filter.user.js` |
| `chesscom-lichess-export` | chess.com | [594491](https://greasyfork.org/en/scripts/594491-chess-com-lichess-export) | `dist/chesscom-lichess-export.user.js` |

## Archived (unsupported)

These remain in the repo for history only. Do not expect fixes or Greasy Fork updates.

| Package | Former GF listing |
| --- | --- |
| `lichess-stats` | [522313](https://greasyfork.org/en/scripts/522313-lichess-training-stats-for-current-run) |
| `udemy-section-time` | [28295](https://greasyfork.org/en/scripts/28295-udemy-show-section-time) |
| `lattice-goal-ideal` | [profile](https://greasyfork.org/en/users/111366-pedro-mass) |

Rebuild all packages (including archived): `pnpm build:all`

## Add a new userscript

1. Copy `packages/live-chart-filter/` as a template.
2. Update `vite.config.ts` metadata (`match`, `name`, `version`, update URLs).
3. Add `"@userscripts/shared": "workspace:*"` if you need shared helpers.
4. Document in `docs/publishing.md` and this README.

## Extension path

Keep privileged APIs behind `packages/shared` adapters (`storage`, `http`, etc.) so a future Chrome MV3 extension can swap implementations without rewriting DOM logic.
