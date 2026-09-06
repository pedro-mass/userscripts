# Chrome Web Store path

Userscript is shipped ([Greasy Fork 594491](https://greasyfork.org/en/scripts/594491-chess-com-lichess-export)). This doc tracks the MV3 extension phase.

## Why extend

| Gap | Our answer |
| --- | --- |
| WojtekTB extension broken (stale selectors, `/analysis/game/` missing) | `data-cy` anchors + analysis URLs |
| Tampermonkey friction for casual users | One-click CWS install |
| InvictusNavarchus GF stale | Maintained listing + GitHub sync |

## Reuse (do not rewrite)

| Layer | Today | Extension |
| --- | --- | --- |
| DOM + buttons | `src/button.ts`, `src/config.ts` | content script (same bundle) |
| PGN extraction | `src/adapters/pgn.ts` | same |
| Lichess import | `src/adapters/lichess.ts` (`GM_xmlhttpRequest`) | `chrome.runtime` message → service worker `fetch` |
| Cache | `src/storage.ts` (`GM_*`) | `chrome.storage.local` adapter |
| UI theme | `src/ui/lichess-theme.ts` | same |

Follow monorepo [extension path](../../../README.md#extension-path): thin adapters in `packages/shared` or `src/platform/`, not duplicated logic.

## Store assets (ready)

Regenerate: `pnpm capture:store:chesscom`

| Asset | Path | CWS use |
| --- | --- | --- |
| Screenshots 1280×800 | `store/images/game-*.png`, `promo-1280x800.png` | Listing (up to 5) |
| Small promo 440×280 | `store/images/promo-440x280.png` | Optional promo |
| Icons 128 / 48 | `store/images/icon-128.png`, `icon-48.png` | Extension manifest |

Copy for listing: `greasyfork.additional-info.md` (features, GPL, attribution).

## Build phases

### 1. Platform adapters (small)

- `importPgn` / storage behind interfaces used by `analyseOnLichess.ts`
- Userscript keeps `GM_*`; extension injects `chrome.*` implementations
- One test path: run userscript build unchanged

### 2. MV3 package

```
packages/chesscom-lichess-export/extension/
  manifest.json       # MV3, chess.com host_permissions, lichess.org
  service-worker.ts   # fetch POST /api/import
  content-script.ts   # imports ../src/main.ts entry or shared init
```

- `manifest.json`: `content_scripts` on `https://www.chess.com/*`, `https://chess.com/*`
- No remote code; bundle with Vite (second build target or `@crxjs/vite-plugin`)
- Permissions: `storage`, host permission `https://lichess.org/*`

### 3. CWS submission

- Developer account ($5 one-time)
- Privacy policy URL (GitHub repo README or short `PRIVACY.md` — no data leaves browser except Lichess API)
- Single purpose: export chess.com games to Lichess for analysis
- Screenshots + icons from `store/images/`
- GPL-3.0-only — source link in listing (same GitHub tree)

## Not in v1 extension

- Firefox AMO (can add later with same bundle)
- Account sync / cloud
- In-page Lichess embed

## Release flow (extension)

1. Bump version in `vite.config.ts` + `extension/manifest.json`
2. `pnpm build:chesscom` + extension build (TBD)
3. Zip for CWS dashboard upload
4. Userscript GF listing stays for Tampermonkey users; CWS for non-technical users

## Related

- [store/README.md](../store/README.md)
- [ATTRIBUTION.md](../ATTRIBUTION.md)
- [publishing.md](../../../docs/publishing.md)
