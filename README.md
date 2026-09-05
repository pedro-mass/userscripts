# userscripts

Personal browser userscripts (Tampermonkey / Violentmonkey), built as a pnpm monorepo.

**Actively maintained:** [LiveChart.me minimum rating filter](packages/live-chart-filter/) only. Other packages are archived in-repo and no longer supported.

## Layout

```
packages/
  live-chart-filter/   # maintained
  shared/              # shared DOM helpers
  lichess-stats/       # archived (unsupported)
  udemy-section-time/  # archived (unsupported)
  lattice-goal-ideal/  # archived (unsupported)
legacy/                # pre-monorepo flat sources
```

## Quick start (LiveChart)

```bash
pnpm install
pnpm build              # packages/live-chart-filter only
pnpm dev                # HMR dev server
```

Install: open `packages/live-chart-filter/dist/live-chart-filter.user.js` in Tampermonkey, or use the [Greasy Fork listing](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent).

**Publishing:** [docs/publishing.md](docs/publishing.md)

## Maintained package

| Package | Site | Greasy Fork | Output |
| --- | --- | --- | --- |
| `live-chart-filter` | livechart.me | [547862](https://greasyfork.org/en/scripts/547862-livechart-me-minimum-rating-filter-with-themed-ui-persistent) | `dist/live-chart-filter.user.js` |

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
