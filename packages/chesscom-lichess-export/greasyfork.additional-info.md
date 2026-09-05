One-click PGN export from Chess.com to Lichess.

Adds **Analyse on Lichess** on finished games (game-over modal and Game Review sidebar) and **Export to Lichess** in the Share dialog. Imports via the Lichess public API and opens the game in a new tab.

### Screenshots

![Analyse on Lichess in the Game Review sidebar](https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/store/images/game-review-sidebar.png)

![Analyse on Lichess on the game-over modal](https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/store/images/game-over-modal.png)

![Export to Lichess in the Share dialog (PGN tab)](https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/store/images/share-modal.png)

### Features

- One-click export (no manual PGN copy)
- Per-game cache (re-open skips re-import)
- Live, daily, and analysis review URLs
- Callback API fallback if the share UI changes

### Source

https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export

GPL-3.0-only. Incorporates logic adapted from [chesscom-to-lichess-export](https://github.com/InvictusNavarchus/chesscom-to-lichess-export) by Invictus Navarchus.
