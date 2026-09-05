# Chess.com → Lichess Export

One-click PGN export from Chess.com to Lichess (game-over modal, Game Review sidebar, Share dialog).

## Install

**Greasy Fork:** [594491 - Chess.com → Lichess Export](https://greasyfork.org/en/scripts/594491-chess-com-lichess-export) (recommended)

Store images: [`store/`](./store/) · regenerate with `pnpm capture:store`

Dev: build `dist/chesscom-lichess-export.user.js` and install in Tampermonkey / Violentmonkey.

```bash
pnpm --filter @userscripts/chesscom-lichess-export build
```

## Derivative work

This package is licensed under **GPL-3.0-only**. It incorporates logic adapted from [chesscom-to-lichess-export](https://github.com/InvictusNavarchus/chesscom-to-lichess-export) by Invictus Navarchus (GPL-3.0-only). See [ATTRIBUTION.md](./ATTRIBUTION.md) and [LICENSE](./LICENSE).
