# userscripts — agent notes

Personal Tampermonkey monorepo. Global workflow: `~/.agent/AGENTS.md`.

## Start here

1. [README.md](../README.md)
2. **[docs/verify-in-browser.md](../docs/verify-in-browser.md)** — mandatory before userscript/extension work
3. [docs/publishing.md](../docs/publishing.md) — Greasy Fork after proof

## Operating model

JavaScript on the live site first → userscript build → extension. Agents verify in the **Cursor in-app browser**, then demo (screenshot + steps) for Pedro. See verify doc for injection and acceptance checks.
