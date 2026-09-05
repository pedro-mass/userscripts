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

(function () {
  'use strict';

  var _GM_getValue = /* @__PURE__ */ (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_openInTab = /* @__PURE__ */ (() => typeof GM_openInTab != "undefined" ? GM_openInTab : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _GM_xmlhttpRequest = /* @__PURE__ */ (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
  function importPgn(pgn) {
    return new Promise((resolve, reject) => {
      _GM_xmlhttpRequest({
        method: "POST",
        url: "https://lichess.org/api/import",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        data: `pgn=${encodeURIComponent(pgn)}`,
        onload(response) {
          if (response.status !== 200) {
            reject(new Error(`Lichess API returned ${response.status}`));
            return;
          }
          try {
            resolve(JSON.parse(response.responseText));
          } catch {
            reject(new Error("Failed to parse Lichess response"));
          }
        },
        onerror() {
          reject(new Error("Network error contacting Lichess"));
        }
      });
    });
  }
  const GAME_PATH_FRAGMENTS = ["/game/", "/play/", "/analysis/game/"];
  const ABORTED_GAME_SELECTORS = [
    ".game-over-modal-header-is-v6-aborted",
    ".game-over-aborted-body-component",
    ".game-over-header-abortedIcon"
  ];
  const BUTTON_ANCHOR_SELECTORS = [
    '[data-cy="game-over-modal-shell-buttons"]',
    ".game-over-modal-shell-buttons",
    ".game-over-buttons-component",
    '[data-cy="game-review-buttons-component"]',
    ".game-review-buttons-component"
  ];
  const SHARE_MODAL_SELECTORS = {
    modal: '[data-cy="share-menu-modal"], [role="dialog"][class*="share"], #share-modal',
    injectId: "cc2l-share-export-btn"
  };
  const PGN_SELECTORS = {
    secondaryMenu: ".game-controls-secondary-more > button, .game-controls-secondary-button > button",
    shareBtn: '[data-cy="sidebar-share-icon"], [data-cy="analysis-secondary-controls-menu-open-share"], button[aria-label="Share"], button.share-button-component.icon-share, button.share-button-component.share, #shareMenuButton',
    pgnTabActive: '#tab-pgn.cc-tab-item-active, [data-cy="pgn-tab-button"][aria-selected="true"]',
    pgnTab: '#tab-pgn, [data-cy="pgn-tab-button"], #live_ShareMenuGlobalDialogDownloadButton',
    dialogButtons: 'dialog button, [role="dialog"] button, [class*="modal"] button, [class*="share"] button',
    textarea: '.share-menu-tab-pgn-textarea, #live_ShareMenuPgnContentTextareaId, textarea[name=pgn], textarea[aria-label="PGN"], #chessboard_ShareMenuPgnContentTextareaId',
    timestampsCheckbox: "#tab-pgn-timestamps",
    closeBtn: '.cc-close-button-component, [data-cy="modal-close-button"], #live_ShareMenuGlobalDialogCloseButton, button.ui_outside-close-component, #chessboard_ShareMenuGlobalDialogCloseButton'
  };
  const WIN_MODAL_TEXT = ["You Won", "You Lost", "Draw"];
  function waitForElement(selector, options = {}) {
    const { timeoutMs = 5e3, predicate } = options;
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const check = () => {
        const el = document.querySelector(selector);
        if (el && (!predicate || predicate(el))) {
          resolve(el);
          return;
        }
        if (Date.now() >= deadline) {
          reject(new Error(`waitForElement timed out: "${selector}"`));
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }
  function normalizePgn(pgn) {
    if (pgn.includes(" won on time")) {
      return pgn.replace(/Termination "[^"]+"/g, 'Termination "Time forfeit"');
    }
    return pgn.replace(/Termination "[^"]+"/g, 'Termination "Normal"');
  }
  async function openShareDialog() {
    const secondaryBtn = document.querySelector(
      PGN_SELECTORS.secondaryMenu
    );
    if (secondaryBtn) {
      secondaryBtn.click();
      await waitForElement(PGN_SELECTORS.shareBtn);
    }
    const shareBtn = document.querySelector(PGN_SELECTORS.shareBtn);
    if (!shareBtn) throw new Error("Share button not found");
    shareBtn.click();
    await waitForElement(`${PGN_SELECTORS.pgnTab}, ${PGN_SELECTORS.textarea}`);
  }
  async function openPgnTab() {
    if (document.querySelector(PGN_SELECTORS.pgnTabActive)) return;
    const pgnTab = document.querySelector(PGN_SELECTORS.pgnTab) ?? Array.from(
      document.querySelectorAll(PGN_SELECTORS.dialogButtons)
    ).find((el) => {
      var _a;
      return ((_a = el.textContent) == null ? void 0 : _a.trim()) === "PGN";
    });
    if (pgnTab) {
      pgnTab.click();
      await waitForElement(PGN_SELECTORS.textarea);
    }
  }
  function closeShareDialog() {
    var _a;
    (_a = document.querySelector(PGN_SELECTORS.closeBtn)) == null ? void 0 : _a.click();
  }
  function readTextareaValue(ta) {
    return (ta.value || ta.getAttribute("value") || ta.textContent || "").trim();
  }
  async function readPgnFromTextarea() {
    const timestampsCheckbox = document.querySelector(
      PGN_SELECTORS.timestampsCheckbox
    );
    if (timestampsCheckbox == null ? void 0 : timestampsCheckbox.checked) {
      timestampsCheckbox.click();
    }
    const textarea = await waitForElement(
      PGN_SELECTORS.textarea,
      {
        predicate: (el) => readTextareaValue(el).length > 0
      }
    );
    return readTextareaValue(textarea);
  }
  async function extractPgnFromOpenShareModal() {
    await openPgnTab();
    const pgn = normalizePgn(await readPgnFromTextarea());
    if (!/^\s*\[Event /m.test(pgn)) {
      throw new Error("PGN not ready in share dialog");
    }
    return pgn;
  }
  async function extractPgnViaShareFlow() {
    await openShareDialog();
    await openPgnTab();
    let pgn;
    try {
      pgn = normalizePgn(await readPgnFromTextarea());
    } finally {
      closeShareDialog();
    }
    return pgn;
  }
  async function fetchPgnFromCallbackApi(gameId) {
    var _a;
    const kinds = ["live", "daily"];
    for (const kind of kinds) {
      const url = `https://www.chess.com/callback/${kind}/game/${gameId}`;
      try {
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) continue;
        const data = await response.json();
        const pgn = (_a = data.game) == null ? void 0 : _a.pgn;
        if (pgn == null ? void 0 : pgn.trim()) return normalizePgn(pgn);
      } catch {
      }
    }
    throw new Error("Could not load PGN from chess.com API");
  }
  async function resolvePgn(gameId) {
    const openTextarea = document.querySelector(
      PGN_SELECTORS.textarea
    );
    if (openTextarea && readTextareaValue(openTextarea).length > 0) {
      try {
        return await extractPgnFromOpenShareModal();
      } catch {
      }
    }
    try {
      return await extractPgnViaShareFlow();
    } catch (shareError) {
      if (!gameId) throw shareError;
      return fetchPgnFromCallbackApi(gameId);
    }
  }
  const STORAGE_KEY = "cc2l_game_map";
  function extractGameId(pathname = window.location.pathname) {
    const match = pathname.match(/\/(?:analysis\/)?game\/(?:[a-z-]+\/)?(\d+)/i);
    return match ? match[1] : null;
  }
  function getGameMap() {
    try {
      const raw = _GM_getValue(STORAGE_KEY, "{}");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  function getStoredLichessUrl(gameId) {
    return getGameMap()[gameId] ?? null;
  }
  function saveLichessUrl(gameId, lichessUrl) {
    const map = getGameMap();
    map[gameId] = lichessUrl;
    _GM_setValue(STORAGE_KEY, JSON.stringify(map));
  }
  async function analyseOnLichess() {
    const gameId = extractGameId();
    if (gameId) {
      const cachedUrl = getStoredLichessUrl(gameId);
      if (cachedUrl) {
        _GM_openInTab(cachedUrl, { active: true, insert: true });
        return;
      }
    }
    const pgn = await resolvePgn(gameId);
    if (!pgn.includes("[Termination")) {
      throw new Error("Game is not finished yet");
    }
    const result = await importPgn(pgn);
    if (gameId) {
      saveLichessUrl(gameId, result.url);
    }
    _GM_openInTab(result.url, { active: true, insert: true });
  }
  const lichessLogoSvg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\n  <path fill="currentColor" d="m37.656 74.009c-4.8354-0.36436-9.6886-1.699-13.955-3.8378-3.4383-1.7236-6.4517-3.92-9.0933-6.628-7.0896-7.2676-10.055-17.334-8.1548-27.684 1.5646-8.5227 6.1202-15.614 12.927-20.122 6.4164-4.2497 14.836-6.2637 24.632-5.8922l2.1764 0.082493 0.71448-0.46162c2.8371-1.8331 5.781-2.7675 10.74-3.409 1.3469-0.17424 1.5334-0.18309 1.7288-0.082031 0.24019 0.1242 0.31608 0.26074 0.31608 0.56864 0 0.11136-0.4595 2.1736-1.0211 4.5828-1.0078 4.3233-1.0194 4.3838-0.89332 4.6483 0.07031 0.14737 0.50749 0.95627 0.97159 1.7975 0.4641 0.84128 0.96793 1.7581 1.1196 2.0374 0.15171 0.2793 1.5664 2.8457 3.1439 5.7031 1.5774 2.8574 3.8363 6.9531 5.0198 9.1016 3.237 5.8763 4.9952 9.0631 5.4255 9.8339 0.50792 0.90969 0.63287 1.4871 0.62769 2.9005-0.0037 0.91614-0.03691 1.2203-0.20664 1.8732-0.86524 3.328-3.915 6.1562-8.8068 8.167-1.1079 0.45544-2.3332 0.85827-2.6106 0.85827-0.25397 0-0.38898-0.15415-1.129-1.2891-1.3352-2.0478-3.9112-4.9986-6.541-7.4929-1.5045-1.427-2.0154-1.8499-5.6466-4.6744-4.6142-3.5891-6.2759-5.0009-8.48-7.2045-3.9949-3.9941-5.887-7.2765-6.1716-10.706-0.08995-1.0838 0.18839-2.7981 0.50585-3.1155 0.41619-0.41619 1.1662-0.01476 1.064 0.56953-0.02694 0.15422-0.06902 0.65348-0.09347 1.1095-0.03663 0.68284-0.01606 0.94126 0.11629 1.4648 0.63768 2.5217 3.041 5.405 7.3949 8.8718 2.0126 1.6025 3.381 2.5855 7.6172 5.4717 5.194 3.5387 5.6984 3.9377 8.1641 6.4574 2.308 2.3586 3.494 3.8269 4.3474 5.3817 0.22404 0.4082 0.4147 0.75294 0.42366 0.7661 0.03949 0.05785 1.0174-0.24498 1.6091-0.49822 2.5156-1.0767 4.1441-3.2328 4.6375-6.1402l0.12817-0.75512-2.3219-3.8933c-1.2771-2.1413-2.9627-4.9656-3.7459-6.2761-2.1258-3.5573-10.258-17.183-10.81-18.114-0.26416-0.44496-0.4989-0.88442-0.52166-0.97656-0.0251-0.10167 0.35524-1.304 0.96742-3.0582 1.1589-3.3208 1.1586-3.0658 0.0028-2.7713-1.7885 0.45585-3.5267 1.2861-7.057 3.3706-0.71397 0.4216-1.2524 0.68973-1.385 0.68973-0.11934 0-0.6484-0.06957-1.1757-0.15451-2.4739-0.39872-5.0621-0.55615-7.5603-0.45987-5.5228 0.21286-10.604 1.8776-14.844 4.8634-4.762 3.3535-8.8329 8.8527-10.751 14.524-2.991 8.8413-0.68144 19.066 6.03 26.696 4.991 5.6739 11.828 9.2927 19.487 10.315 1.578 0.21053 4.5386 0.28823 6.1195 0.16059 7.0509-0.56924 13.253-3.3262 18.267-8.1207 0.79159-0.75686 0.94438-0.87009 1.174-0.87009 0.61003 0 0.83436 0.48111 0.49462 1.0608-0.76303 1.302-2.9045 3.6393-4.5382 4.9532-4.0237 3.236-9.0858 5.1841-14.924 5.7434-1.1092 0.10625-4.5728 0.1453-5.655 0.06376z"/>\n</svg>\n';
  const NS = `cc2l_${Math.random().toString(36).slice(2, 10)}`;
  const STYLE_ID = `${NS}_style`;
  const BUTTON_CONTENT = {
    idle: `${lichessLogoSvg} Analyse on Lichess`,
    cached: `${lichessLogoSvg} Re-open on Lichess ✓`,
    loading: "⏳ Importing…",
    error: "❌ Failed — retry?"
  };
  const SHARE_IDLE = `${lichessLogoSvg} Export to Lichess`;
  function isMainButtonInjected() {
    return document.getElementById(NS) !== null;
  }
  function findButtonAnchor() {
    for (const selector of BUTTON_ANCHOR_SELECTORS) {
      const anchor = document.querySelector(selector);
      if (anchor) return anchor;
    }
    return findWinModalAnchorByText();
  }
  function findWinModalAnchorByText() {
    for (const phrase of WIN_MODAL_TEXT) {
      const heading = Array.from(document.querySelectorAll("*")).find(
        (el) => {
          const ownText = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => {
            var _a;
            return ((_a = n.textContent) == null ? void 0 : _a.trim()) ?? "";
          }).join("");
          return ownText.includes(phrase);
        }
      );
      if (!heading) continue;
      let candidate = heading;
      for (let i = 0; i < 8 && candidate; i++) {
        candidate = candidate.parentElement;
        if (!candidate) break;
        const reviewBtn = Array.from(
          candidate.querySelectorAll('button, a, [role="button"]')
        ).find((el) => /game review/i.test(el.textContent ?? ""));
        if (reviewBtn == null ? void 0 : reviewBtn.parentElement) return reviewBtn.parentElement;
      }
    }
    return null;
  }
  function injectMainButton(onClick, initialState = "idle") {
    const anchor = findButtonAnchor();
    if (!anchor) return false;
    const btn = document.createElement("button");
    btn.id = NS;
    btn.type = "button";
    btn.className = "cc2l-btn";
    btn.innerHTML = BUTTON_CONTENT[initialState];
    btn.addEventListener("click", onClick);
    const secondaryActions = anchor.querySelector(
      ".game-over-secondary-actions-row-component"
    );
    if (secondaryActions) {
      anchor.insertBefore(btn, secondaryActions);
    } else {
      anchor.appendChild(btn);
    }
    injectStyles();
    return true;
  }
  function setMainButtonState(state) {
    const btn = document.getElementById(NS);
    if (!btn) return;
    btn.innerHTML = BUTTON_CONTENT[state];
    btn.disabled = state === "loading";
  }
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .cc2l-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 2rem 4rem;
      margin-top: 8px;
      border: none;
      border-radius: 0.5em;
      background: #5a8f3a;
      color: #ffffff;
      font-size: 22px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      box-sizing: border-box;
    }
    [data-cy="game-over-modal-shell-buttons"] .cc2l-btn,
    .game-over-modal-shell-buttons .cc2l-btn {
      width: auto;
      padding: 1.3rem 2rem;
      max-width: 100%;
      margin: 8px 1.6rem;
    }
    .cc2l-btn svg,
    .cc2l-share-btn svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    .cc2l-share-btn svg {
      width: 20px;
      height: 20px;
    }
    .cc2l-btn:hover:not(:disabled) { background: #4a7a30; }
    .cc2l-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .cc2l-share-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 12px;
      padding: 12px 16px;
      border: none;
      border-radius: 0.5em;
      background: #5a8f3a;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .cc2l-share-btn:hover:not(:disabled) { background: #4a7a30; }
    .cc2l-share-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  `;
    document.head.appendChild(style);
  }
  function injectShareModalButton(onClick) {
    const modal = document.querySelector(SHARE_MODAL_SELECTORS.modal);
    if (!modal || modal.querySelector(`#${SHARE_MODAL_SELECTORS.injectId}`)) return;
    const downloadBtn = Array.from(modal.querySelectorAll("button")).find(
      (btn2) => /download/i.test(btn2.textContent ?? "")
    );
    const btn = document.createElement("button");
    btn.id = SHARE_MODAL_SELECTORS.injectId;
    btn.type = "button";
    btn.className = "cc2l-share-btn";
    btn.innerHTML = SHARE_IDLE;
    btn.addEventListener("click", onClick);
    injectStyles();
    if (downloadBtn == null ? void 0 : downloadBtn.parentElement) {
      downloadBtn.parentElement.insertBefore(btn, downloadBtn);
    } else {
      modal.appendChild(btn);
    }
  }
  function setShareModalButtonState(state) {
    const btn = document.getElementById(
      SHARE_MODAL_SELECTORS.injectId
    );
    if (!btn) return;
    btn.innerHTML = state === "idle" ? SHARE_IDLE : BUTTON_CONTENT[state];
    btn.disabled = state === "loading";
  }
  function isOnGamePage() {
    return GAME_PATH_FRAGMENTS.some(
      (fragment) => window.location.pathname.includes(fragment)
    );
  }
  function isGameAborted() {
    return ABORTED_GAME_SELECTORS.some(
      (selector) => document.querySelector(selector) !== null
    );
  }
  function initialButtonState() {
    const id = extractGameId();
    return id && getStoredLichessUrl(id) ? "cached" : "idle";
  }
  async function runExport(setState) {
    setState("loading");
    try {
      await analyseOnLichess();
      setState("cached");
    } catch (err) {
      console.error("[chesscom-lichess-export]", err);
      setState("error");
      const id = extractGameId();
      const fallback = id && getStoredLichessUrl(id) ? "cached" : "idle";
      setTimeout(() => setState(fallback), 3e3);
    }
  }
  function tickMainButton() {
    if (!isOnGamePage() || isGameAborted() || isMainButtonInjected()) return;
    injectMainButton(() => {
      void runExport(setMainButtonState);
    }, initialButtonState());
  }
  function tickShareModalButton() {
    if (!isOnGamePage()) return;
    if (!document.querySelector(SHARE_MODAL_SELECTORS.modal)) return;
    injectShareModalButton(() => {
      void runExport(setShareModalButtonState);
    });
  }
  setInterval(() => {
    tickMainButton();
    tickShareModalButton();
  }, 500);
  tickMainButton();
  tickShareModalButton();

})();