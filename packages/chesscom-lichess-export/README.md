# Chess.com → Lichess Export

One-click PGN export from Chess.com to Lichess (game-over modal, Game Review sidebar, Share dialog).

## Install

**Chrome Web Store:** upload `dist/chesscom-lichess-export-extension-<version>.zip` (see [docs/cws-listing.md](./docs/cws-listing.md)). Load unpacked for dev: `dist/extension/` in `chrome://extensions`.

**Greasy Fork:** [594491 - Chess.com → Lichess Export](https://greasyfork.org/en/scripts/594491-chess-com-lichess-export) (Tampermonkey / Violentmonkey)

Store images: [`store/`](./store/) · regenerate with `pnpm capture:store`

Extension build: [docs/chrome-extension.md](./docs/chrome-extension.md) · Privacy: [PRIVACY.md](./PRIVACY.md)

```bash
pnpm build:extension:chesscom    # → dist/extension/
pnpm package:extension:chesscom  # → dist/chesscom-lichess-export-extension-<version>.zip
```

Userscript dev build:

```bash
pnpm build:chesscom
```

## Derivative work

This package is licensed under **GPL-3.0-only**. It incorporates logic adapted from [chesscom-to-lichess-export](https://github.com/InvictusNavarchus/chesscom-to-lichess-export) by Invictus Navarchus (GPL-3.0-only). See [ATTRIBUTION.md](./ATTRIBUTION.md) and [LICENSE](./LICENSE).
