// ==UserScript==
// @name         ChessTempo → Lichess mirror
// @namespace    https://github.com/pedro-mass/userscripts/chesstempo-lichess-mirror
// @version      0.1.1
// @author       pedro-mass
// @description  Mirror ChessTempo opening-training position to a Lichess analysis tab (Open in Lichess + live FEN sync).
// @license      GPL-3.0-only
// @icon         https://lichess.org/favicon.ico
// @homepageURL  https://github.com/pedro-mass/userscripts/tree/main/packages/chesstempo-lichess-mirror
// @supportURL   https://github.com/pedro-mass/userscripts/issues
// @downloadURL  https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesstempo-lichess-mirror/dist/chesstempo-lichess-mirror.user.js
// @updateURL    https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesstempo-lichess-mirror/dist/chesstempo-lichess-mirror.meta.js
// @match        https://chesstempo.com/opening-training/*
// @match        https://www.chesstempo.com/opening-training/*
// @match        https://lichess.org/analysis*
// @grant        GM_addValueChangeListener
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_setValue
// @inject-into  page
// @run-at       document-idle
// ==/UserScript==