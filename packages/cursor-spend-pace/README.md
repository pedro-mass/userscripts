# Cursor Spending Pace

Tampermonkey userscript for [cursor.com/dashboard/spending](https://cursor.com/dashboard/spending).

Shows a **pace marker** on each included usage bar so you can see whether you are ahead or behind an even linear burn for the billing window.

## What it does

- Reads billing dates and usage from Cursor's same-origin APIs (session cookies only; no third-party calls)
- Monthly pools: **Cursor Models** and **Other Models**
- Weekly pool: **Grok Bot** (separate window)
- Injects a vertical pace line, label, and short status (`under pace`, `ahead of pace`, `on pace`)

## Install (local)

```bash
pnpm install
pnpm build:cursor-pace
```

Install `dist/cursor-spend-pace.user.js` in Tampermonkey, then open the Spending tab while logged in.

## Dev

```bash
pnpm dev:cursor-pace
```

Point Tampermonkey at the Vite dev server output or rebuild after edits.
