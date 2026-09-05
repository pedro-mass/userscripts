// ==UserScript==
// @name         Chess.com → Lichess Export
// @namespace    https://github.com/pedro-mass/userscripts/chesscom-lichess-export
// @version      0.1.1
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
  const MAIN_LABELS = {
    idle: "Open in Lichess",
    cached: "View on Lichess again",
    loading: "Opening Lichess…",
    error: "Import failed — retry"
  };
  const SHARE_LABELS = {
    idle: "Send to Lichess",
    cached: "View on Lichess again",
    loading: "Opening Lichess…",
    error: "Import failed — retry"
  };
  const NS = `pam_lichess_${Math.random().toString(36).slice(2, 10)}`;
  const STYLE_ID = `${NS}_style`;
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
    btn.className = "pam-lichess-btn";
    btn.textContent = MAIN_LABELS[initialState];
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
    btn.textContent = MAIN_LABELS[state];
    btn.disabled = state === "loading";
  }
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .pam-lichess-btn,
    .pam-lichess-share-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: 6px;
      border-radius: 6px;
      font-family: inherit;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .pam-lichess-btn {
      padding: 11px 16px;
      border: 1px solid #81b64c;
      background: #2b2a28;
      color: #f0ede8;
      font-size: 15px;
    }
    [data-cy="game-over-modal-shell-buttons"] .pam-lichess-btn,
    .game-over-modal-shell-buttons .pam-lichess-btn {
      width: auto;
      min-width: 12rem;
      max-width: calc(100% - 3.2rem);
      margin: 6px 1.6rem 0;
    }
    .pam-lichess-btn:hover:not(:disabled) {
      background: #363532;
      border-color: #9bc964;
    }
    .pam-lichess-share-btn {
      padding: 10px 14px;
      border: 1px dashed #81b64c;
      background: transparent;
      color: #c5e1a5;
      font-size: 14px;
    }
    .pam-lichess-share-btn:hover:not(:disabled) {
      background: rgba(129, 182, 76, 0.12);
      border-style: solid;
    }
    .pam-lichess-btn:disabled,
    .pam-lichess-share-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
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
    btn.className = "pam-lichess-share-btn";
    btn.textContent = SHARE_LABELS.idle;
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
    btn.textContent = SHARE_LABELS[state];
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