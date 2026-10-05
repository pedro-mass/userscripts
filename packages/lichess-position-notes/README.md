# Lichess position notes

Userscript: index **your** Lichess study comments by board position (EPD / FEN fields 1–4) and show prior notes when you revisit the same position (including transpositions).

## Dev

```bash
cd repos/userscripts
pnpm install
pnpm --filter @userscripts/lichess-position-notes dev
```

Build: `pnpm --filter @userscripts/lichess-position-notes build` → `dist/lichess-position-notes.user.js`.

**Verify:** inject built JS in the Cursor in-app browser on a study chapter URL before Tampermonkey. [docs/verify-in-browser.md](../../docs/verify-in-browser.md).

## Usage

1. Open a study (e.g. `https://lichess.org/study/oDP5q102`).
2. Open the **Comments** tab on a move.
3. Use **Import this study** to batch-ingest from the Lichess API.
4. New comments saved while **REC** is on are added via the study WebSocket hook.

Research notes: PAM `.work/plans/lichess-position-notes/RESEARCH.md`.
