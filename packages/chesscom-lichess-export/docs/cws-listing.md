# Chrome Web Store listing copy

Use after uploading `dist/chesscom-lichess-export-extension-<version>.zip`.

## Package

```bash
pnpm build:extension:chesscom
pnpm package:extension
```

Zip path: `packages/chesscom-lichess-export/dist/chesscom-lichess-export-extension-<version>.zip`

## Listing fields

| Field | Value |
| --- | --- |
| **Name** | Chess.com → Lichess Export |
| **Summary** | One-click PGN export from Chess.com to Lichess for analysis |
| **Category** | Productivity or Fun |
| **Language** | English |

### Description

One-click PGN export from Chess.com to Lichess.

Adds **Analyse on Lichess** on finished games (game-over modal and Game Review sidebar) and **Export to Lichess** in the Share dialog. Imports via the public Lichess API and opens the game in a new tab.

Features:

- One-click export (no manual PGN copy)
- Per-game cache (re-open skips re-import)
- Live, daily, and analysis review URLs

Open source (GPL-3.0-only): https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export

### Privacy policy URL

https://github.com/pedro-mass/userscripts/blob/main/packages/chesscom-lichess-export/PRIVACY.md

### Single purpose

Export Chess.com games to Lichess for analysis.

### Screenshots and icons

`store/images/` — see [store/README.md](../store/README.md).

### Permissions justification (review)

- **storage** — cache Chess.com game id → Lichess URL locally
- **chess.com** — inject export buttons on pages you visit
- **lichess.org** — POST PGN when you click export (Lichess public import API)

No remote code. No data sent except user-triggered Lichess import.
