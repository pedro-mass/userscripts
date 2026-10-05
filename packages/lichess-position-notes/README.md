# Lichess position notes

Userscript: index **your** Lichess study comments by board position (EPD / FEN fields 1–4) and show notes from **other chapters** when you revisit the same position (including transpositions).

## Install

- **Tampermonkey / Violentmonkey:** install `dist/lichess-position-notes.user.js` (or Greasy Fork once listed).
- Auto-update: `@updateURL` points at raw GitHub `dist/lichess-position-notes.meta.js` on `main`.

## Usage

1. Open a study (e.g. `https://lichess.org/study/oDP5q102`).
2. Open the **Comments** tab on a move.
3. **This chapter** comment stays in Lichess’s textarea; the panel lists **other chapters** at the same board (↗ jumps there).
4. **Import this study** batch-ingests from the Lichess API (use after opening a study or when notes look stale).
5. New comments while **REC** is on are captured via WebSocket and `study.makeChange` hooks.

Lichess **SYNC** is server collab sync; the local index still updates when you save a comment.

## Dev

```bash
cd repos/userscripts
pnpm install
pnpm --filter @userscripts/lichess-position-notes dev
```

Build: `pnpm --filter @userscripts/lichess-position-notes build` → `dist/lichess-position-notes.user.js`.

Test: `pnpm --filter @userscripts/lichess-position-notes test`.

**Verify (recommended):** Brave + Tampermonkey on a real study chapter. Optional CDP helper: `scripts/verify-lpn-brave-cdp.mjs` (see repo `scripts/`). In-app Cursor browser is a poor stand-in for TM.

Research notes: PAM `.work/plans/lichess-position-notes/RESEARCH.md`.
