# ChessTempo → Lichess mirror

Tampermonkey userscript: while editing a repertoire on **ChessTempo opening training**, open **Lichess analysis** at the same position and keep the analysis board in sync when you navigate on CT.

## Install

1. Build: `pnpm --filter @userscripts/chesstempo-lichess-mirror build`
2. Install `dist/chesstempo-lichess-mirror.user.js` in Tampermonkey.
3. Enable on `chesstempo.com` and `lichess.org`.

## Usage

1. Open **ChessTempo** opening training / repertoire editor.
2. Click **Open in Lichess** (top of right panel). A Lichess analysis tab opens with `?pamMirror=<id>`.
3. Navigate on CT — the paired Lichess tab plays one move when possible, otherwise reloads analysis at the new FEN.

Repertoire edits stay on ChessTempo only; Lichess is a read-only mirror for explorer / engine / LiChess Tools.

## Dev

```bash
cd repos/userscripts
pnpm install
pnpm --filter @userscripts/chesstempo-lichess-mirror dev
```

Tests: `pnpm --filter @userscripts/chesstempo-lichess-mirror test`
