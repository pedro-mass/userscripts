// ==UserScript==
// @name         Chess.com → Lichess Export
// @namespace    https://github.com/pedro-mass/userscripts/chesscom-lichess-export
// @version      1.0.2
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
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @connect      lichess.org
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==