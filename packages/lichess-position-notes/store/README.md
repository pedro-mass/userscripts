# Store assets — Lichess position notes

Listing images for **Greasy Fork** ([598871](https://greasyfork.org/en/scripts/598871-lichess-study-position-notes)).

## Images

| File | Use |
| --- | --- |
| `images/study-underboard.png` | Comments tab: cross-chapter notes panel |
| `images/study-index-toolbar.png` | Index details: Import / Export |

Recapture (Brave + Tampermonkey, remote debugging on 9222):

```bash
# From repos/userscripts — uses open lichess study tab
node scripts/capture-lpn-store-images.mjs
```

Commit `store/images/`, push `main`, then `pnpm greasyfork:sync lichess-position-notes`.

## Public URLs

```text
https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lichess-position-notes/store/images/<file>
```

Referenced from [`greasyfork.additional-info.md`](../greasyfork.additional-info.md).
