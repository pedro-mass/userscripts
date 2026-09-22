# Cursor Spending Pace

Tampermonkey userscript for Cursor spending and usage dashboards:

- Pro: [cursor.com/dashboard/spending](https://cursor.com/dashboard/spending)
- Enterprise team cap: [cursor.com/dashboard/usage](https://cursor.com/dashboard/usage) (**Your monthly usage**)

Shows a **pace marker** on each included usage bar so you can see whether you are ahead or behind an even linear burn for the billing window.

## What it does

- Reads billing dates and usage from Cursor's same-origin APIs (session cookies only; no third-party calls)
- **Pro:** monthly pools **Cursor Models** and **Other Models**
- **Enterprise:** team **Your monthly usage** dollar cap (`individualUsage.overall` on `/api/usage-summary`)
- Weekly pool: **Grok Bot** weekly usage (separate 7-day window, labeled `weekly pace`)
- Injects a vertical pace line, label, and short status (`under pace`, `ahead of pace`, `on pace`)
- Theme-aware colors for Cursor light/dark (`html.dark`, `data-theme`, `prefers-color-scheme`) with WCAG-oriented contrast

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
