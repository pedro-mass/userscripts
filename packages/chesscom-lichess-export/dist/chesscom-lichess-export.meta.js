// ==UserScript==
// @name         Chess.com → Lichess Export
// @namespace    https://github.com/pedro-mass/userscripts/chesscom-lichess-export
// @version      0.1.3
// @author       pedro-mass
// @description  One-click PGN export from Chess.com to Lichess (game-over modal, sidebar, share dialog)
// @license      GPL-3.0-only
// @icon         https://lichess.org/favicon.ico
// @homepageURL  https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export
// @supportURL   https://github.com/pedro-mass/userscripts/issues
// @downloadURL  https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/dist/chesscom-lichess-export.user.js
// @updateURL    https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/dist/chesscom-lichess-export.meta.js
// @match        https://www.chess.com/*
// @match        https://chess.com/*
// @connect      lichess.org
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==