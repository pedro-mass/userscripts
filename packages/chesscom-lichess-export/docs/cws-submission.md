# Chrome Web Store submission (copy-paste)

Extension **1.0.13**. Upload zip from [release](https://github.com/pedro-mass/userscripts/releases/tag/chesscom-extension-v1.0.13) or run `pnpm package:extension:chesscom`.

Work top to bottom in the developer dashboard. Each block below is **plain text** (paste as-is; no markdown).

---

## 1. Package (Upload)

| Field | Value |
| --- | --- |
| Zip file | `packages/chesscom-lichess-export/dist/chesscom-lichess-export-extension-1.0.13.zip` |

After upload, confirm version **1.0.13** and manifest name match.

---

## 2. Store listing

### Product details

| Dashboard field | Paste this | Limit |
| --- | --- | --- |
| **Title** | `Chess.com → Lichess Export` | 45 chars (28) |
| **Summary** (short description) | `One-click PGN export from Chess.com to Lichess for analysis` | 132 chars (60) |
| **Description** | See block below | 16,000 chars |
| **Category** | `Productivity` | pick one |
| **Language** | `English` | default locale |

#### Description (paste entire block)

```text
One-click PGN export from Chess.com to Lichess.

Adds Analyse on Lichess on finished games (game-over modal and Game Review sidebar) and Export to Lichess in the Share dialog. Imports via the public Lichess API and opens the game in a new tab.

Features:
- One-click export (no manual PGN copy)
- Per-game cache (re-open skips re-import)
- Works on live, daily, and analysis review pages

Open source (GPL-3.0-only):
https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export
```

### Graphic assets

Paths relative to `packages/chesscom-lichess-export/`.

| Dashboard field | File | Size |
| --- | --- | --- |
| **Store icon** | `store/images/icon-128.png` | 128×128 |
| **Screenshot 1** | `store/images/game-review-sidebar.png` | 1280×800 |
| **Screenshot 2** | `store/images/game-over-modal.png` | 1280×800 |
| **Screenshot 3** | `store/images/share-modal.png` | 1280×800 |
| **Small promo tile** (optional) | `store/images/promo-440x280.png` | 440×280 |
| **Marquee promo** (optional) | `store/images/promo-1280x800.png` | 1280×800 |

Use the same three screenshots for **Global** and **Localized** if the dashboard asks twice.

### Additional fields (if shown)

| Field | Paste this |
| --- | --- |
| **Official URL** (homepage) | `https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export` |
| **Support URL** | `https://github.com/pedro-mass/userscripts/issues` |
| **Mature content** | No |

---

## 3. Privacy practices

### Privacy policy

| Field | Paste this |
| --- | --- |
| **Privacy policy URL** | `https://github.com/pedro-mass/userscripts/blob/main/packages/chesscom-lichess-export/PRIVACY.md` |

### Single purpose

| Field | Paste this |
| --- | --- |
| **Single purpose description** | `Export Chess.com games to Lichess for analysis when the user clicks an export button.` |

### Data usage (certification questions)

Answer **No** to collecting or transmitting user data **to the developer**. The extension only sends PGN to Lichess when the user clicks export (third-party API, user-initiated).

If a question asks whether the extension handles **page content** or **user activity** on sites you visit:

| Question style | Answer | Notes |
| --- | --- | --- |
| Collect PII for developer | **No** | |
| Sell or transfer data | **No** | |
| Use data for unrelated purpose | **No** | |
| Page content on chess.com | **Yes** (only if required) | Reads PGN from the open Chess.com page when user clicks export; not sent to developer |
| Remote code | **No** | All code in the uploaded package |

When **Yes** is required for page content, use this disclosure text if the form has a free-text field:

```text
The extension reads PGN text from the Chess.com page the user is viewing and sends it to Lichess only when the user clicks Analyse on Lichess or Export to Lichess. No data is sent to the extension developer.
```

### Permission justifications

Paste one justification per permission row the dashboard shows (from `extension/manifest.json`).

**`storage`**

```text
Stores a local mapping of Chess.com game IDs to Lichess URLs on the user's device so re-open skips re-import. Data stays in chrome.storage.local and is not sent to the developer.
```

**Host: `https://www.chess.com/*`**

```text
Injects export buttons on Chess.com pages and reads PGN from the page when the user requests export. The content script runs only on chess.com URLs.
```

**Host: `https://chess.com/*`**

```text
Same as www.chess.com: inject export UI and read PGN on chess.com pages the user visits.
```

**Host: `https://lichess.org/*`**

```text
POSTs PGN to the Lichess public import API when the user clicks export or analyse, then opens the imported game on Lichess.
```

---

## 4. Distribution

| Field | Value |
| --- | --- |
| **Visibility** | Public (or Unlisted for a soft launch) |
| **Regions** | All regions (default) |
| **Pricing** | Free |

---

## 5. Pre-submit checklist

- [ ] Zip uploaded; version **1.0.13**
- [ ] Store listing: title, summary, description, category, language
- [ ] Icon 128×128 + 3 screenshots uploaded
- [ ] Privacy policy URL saved
- [ ] Single purpose filled
- [ ] All four permission justifications filled (`storage` + 3 host patterns)
- [ ] Data usage questions answered consistently with [PRIVACY.md](../PRIVACY.md)
- [ ] Submit for review

---

## 6. After approval

- Add the public CWS URL to [README.md](../README.md) under Install
- Optional: link CWS URL in Greasy Fork additional info for non-Tampermonkey users
