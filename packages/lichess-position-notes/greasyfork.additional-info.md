Index your Lichess **study** comments by chess position and surface notes from **other chapters** when you land on the same board again (transpositions included).

### Screenshots

![Cross-chapter notes, index, and import under the Comments tab](https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lichess-position-notes/store/images/study-underboard.png)

### What you get

- Panel under the comment box: **other chapters** at this position (one row per chapter, newest wins)
- **↗** opens that chapter and move
- **Import this study** pulls comments from the Lichess API into local IndexedDB
- Live capture while **REC** is on when you save comments

Your **current chapter** note stays in Lichess’s normal comment field; the panel is only cross-chapter context.

### Requirements

- Lichess study URL (`lichess.org/study/...`)
- Tampermonkey or Violentmonkey
- For live capture: study edit mode with **REC** when adding comments

### Privacy

`@grant none`. Data stays in your browser (IndexedDB). No analytics beacon.

### Source

https://github.com/pedro-mass/userscripts/tree/main/packages/lichess-position-notes

GPL-3.0-only.
