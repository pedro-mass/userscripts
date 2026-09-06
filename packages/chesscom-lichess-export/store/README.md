# Store assets — Chess.com → Lichess Export

Listing images for **Greasy Fork**, **Chrome Web Store**, and future extension marketing.

## Regenerate

```bash
pnpm --filter @userscripts/chesscom-lichess-export capture:store
```

Source: [`screenshots.html`](./screenshots.html) (chess.com-style mocks with shipped button styles).

## Images

| File | Size | Use |
| --- | --- | --- |
| `images/game-review-sidebar.png` | 1280×800 | GF listing, CWS screenshot |
| `images/game-over-modal.png` | 1280×800 | GF listing, CWS screenshot |
| `images/share-modal.png` | 1280×800 | GF listing, CWS screenshot |
| `images/promo-1280x800.png` | 1280×800 | CWS marquee / hero |
| `images/promo-440x280.png` | 440×280 | CWS small promo tile |
| `images/icon-128.png` | 128×128 | Extension / CWS icon |
| `images/icon-48.png` | 48×48 | Extension toolbar icon |

After changing mocks, re-run capture, commit `store/images/`, push `main`, then `pnpm greasyfork:sync chesscom-lichess-export` (updates listing additional info from GitHub).

## Public URLs (after push to main)

```text
https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/store/images/<file>
```

Referenced from [`greasyfork.additional-info.md`](../greasyfork.additional-info.md).
