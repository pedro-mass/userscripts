# ChessTempo → Lichess mirror v0.1.22

Mirror ChessTempo opening-training positions to a paired Lichess analysis tab, then keep the board in sync as you train.

![Mirror button on ChessTempo opening training](./assets/mirror-button-0.1.22.png)

## Install (Tampermonkey)

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Open the userscript (update URL tracks `main`):

   [chesstempo-lichess-mirror.user.js](https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesstempo-lichess-mirror/dist/chesstempo-lichess-mirror.user.js)

3. Confirm matches for **ChessTempo opening training** and **Lichess analysis**.

## Use

1. Open a repertoire on [ChessTempo opening training](https://chesstempo.com/opening-training/).
2. Click **mirror in lichess** (bottom-right).
3. Play moves on ChessTempo; the Lichess tab follows (one ply when possible, otherwise navigates to the FEN).

ChessTempo stays the editor. Lichess is a read-only mirror for analysis, engines, and LiChess Tools.

## v0.1.22 highlights

- **Live sync** from ChessTempo to Lichess via Tampermonkey storage and a page-world bridge (`GM_addElement`).
- **Board orientation** follows ChessTempo (including black repertoires with `flipped="true"` on `chess-board`).
- **UI** flat Lichess-dark chip, blue accent, **arrow** icon, full label **mirror in lichess**.

## Dev / verify

Package: `packages/chesstempo-lichess-mirror` in [pedro-mass/userscripts](https://github.com/pedro-mass/userscripts).

Browser E2E (Brave + CDP + Tampermonkey): see [verify-in-browser.md](./verify-in-browser.md).
