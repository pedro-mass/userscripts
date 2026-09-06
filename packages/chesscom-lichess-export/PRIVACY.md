# Privacy policy — Chess.com → Lichess Export

**Last updated:** 2026-09-06

This extension runs only on Chess.com pages you open. It does not collect, sell, or transmit personal data to the developer.

## What the extension does

- Reads PGN and game metadata from the Chess.com page you are viewing.
- Sends PGN to Lichess (`https://lichess.org/api/import`) when you click **Analyse on Lichess** or **Export to Lichess**.
- Opens the imported game on Lichess in a new browser tab.
- Stores a small local mapping (Chess.com game id → Lichess URL) in `chrome.storage.local` on your device so re-open skips re-import.

## What we do not do

- No analytics, advertising, or third-party trackers.
- No account linking between Chess.com and Lichess.
- No background scraping; no data sent except the Lichess import request you trigger.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Cache game id → Lichess URL locally |
| `chess.com` (host) | Inject export buttons on Chess.com |
| `lichess.org` (host) | POST PGN to the Lichess import API |

## Contact

Issues: https://github.com/pedro-mass/userscripts/issues

Source: https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export
