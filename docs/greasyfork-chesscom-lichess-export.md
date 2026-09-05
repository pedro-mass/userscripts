# Greasy Fork: Chess.com → Lichess Export

Publish **v1.0.0** from GitHub sync. Profile: [pedro-mass](https://greasyfork.org/en/users/111366-pedro-mass).

## Sync URL (raw — required)

```text
https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/dist/chesscom-lichess-export.user.js
```

Do **not** use a `github.com/.../blob/...` URL.

## Post new script (one-time)

1. Sign in: [greasyfork.org](https://greasyfork.org/en) (same account as LiveChart listing).
2. Open your user menu → **Submit script** (or **Manage** on an existing script → only for updates).
3. Choose **Sync from URL** / automatic sync (not paste code only).
4. Paste the **sync URL** above → **Update and sync now**.
5. Confirm metadata pulled from the userscript header (`@name`, `@description`, `@match`, `@license` GPL-3.0-only).
6. Paste **Additional info** (markdown) from below.
7. Save / publish.

## Additional info (paste into listing)

```markdown
One-click PGN export from Chess.com to Lichess.

Adds **Analyse on Lichess** on finished games (game-over modal and Game Review sidebar) and **Export to Lichess** in the Share dialog. Imports via the Lichess public API and opens the game in a new tab.

### Features

- One-click export (no manual PGN copy)
- Per-game cache (re-open skips re-import)
- Live, daily, and analysis review URLs
- Callback API fallback if the share UI changes

### Source

https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export

GPL-3.0-only. Incorporates logic adapted from [chesscom-to-lichess-export](https://github.com/InvictusNavarchus/chesscom-to-lichess-export) by Invictus Navarchus.
```

## After publish

1. Copy the public script URL (e.g. `https://greasyfork.org/en/scripts/NNNNNN-...`).
2. Update [README.md](../README.md) and [publishing.md](./publishing.md) with the script ID.
3. **Install:** open the listing → green **Install** button (Tampermonkey).
4. Disable/remove the local-file or InvictusNavarchus install so only one chess.com → Lichess script runs.

## Optional: GitHub webhook (instant sync on push)

Same as LiveChart — see [publishing.md](./publishing.md) and [webhook info](https://greasyfork.org/en/users/webhook-info) after the listing exists.

Webhook watches `pedro-mass/userscripts` pushes; sync URL must stay on the raw `dist/` path above.
