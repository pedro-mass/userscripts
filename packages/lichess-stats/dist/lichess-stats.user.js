// ==UserScript==
// @name         Lichess: Training: Stats for Current Run
// @namespace    https://github.com/pedro-mass/userscripts/lichess-stats
// @version      1.2.0
// @author       pedro-mass
// @description  When doing puzzles, this will show you your stats
// @license      GNU GPLv3
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lichess.org
// @downloadURL  https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lichess-stats/dist/lichess-stats.user.js
// @updateURL    https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lichess-stats/dist/lichess-stats.meta.js
// @match        https://lichess.org/training/*
// @match        https://lichess.org/training
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  function waitForElement(root, selector) {
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = root.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      observer.observe(root, { childList: true, subtree: true });
      const existing = root.querySelector(selector);
      if (existing) {
        observer.disconnect();
        resolve(existing);
      }
    });
  }
  function watchElement(root, onChange) {
    const observer = new MutationObserver(onChange);
    observer.observe(root, { childList: true, subtree: true });
    return observer;
  }
  const ids = {
    stats: "pm-stats"
  };
  const selectors = {
    results: ".result-empty",
    stats: `#${ids.stats}`,
    puzzleHolder: ".puzzle__session"
  };
  const constants = {
    failure: "result-false",
    success: "result-true"
  };
  let showFailures = true;
  let clickListenerAttached = false;
  waitForElement(document, selectors.results).then(() => {
    const puzzleHolder = document.querySelector(selectors.puzzleHolder);
    if (!puzzleHolder) return;
    run();
    watchElement(puzzleHolder, (changes) => {
      if (wasTextChange(changes)) return;
      run();
    });
  });
  function wasTextChange(changes) {
    if (changes.length === 0) return false;
    const firstChange = changes[0];
    return firstChange.target instanceof HTMLElement && firstChange.target.id === ids.stats && firstChange.type === "childList";
  }
  function run() {
    const statsElem = getStatsElem();
    displayFailures(statsElem);
    if (clickListenerAttached) return;
    clickListenerAttached = true;
    statsElem.addEventListener("click", () => {
      showFailures = !showFailures;
      if (showFailures) {
        displayFailures(statsElem);
      } else {
        displaySuccesses(statsElem);
      }
    });
  }
  function getResults() {
    return Array.from(document.querySelectorAll(selectors.results));
  }
  function getStatsElem() {
    const existing = document.querySelector(selectors.stats);
    if (existing) return existing;
    return createStatsElem();
  }
  function createStatsElem() {
    const statsElem = document.createElement("div");
    statsElem.id = ids.stats;
    const puzzleHolder = document.querySelector(selectors.puzzleHolder);
    if (!puzzleHolder) {
      throw new Error("lichess-stats: puzzle holder not found");
    }
    puzzleHolder.appendChild(statsElem);
    return statsElem;
  }
  function getStats() {
    const results = getResults();
    const failures = results.filter(
      (element) => element.classList.contains(constants.failure)
    ).length;
    const successes = results.filter(
      (element) => element.classList.contains(constants.success)
    ).length;
    return { total: results.length, failures, successes };
  }
  function displayFailures(elem) {
    const { total, failures } = getStats();
    elem.textContent = `${failures} / ${total} failures`;
  }
  function displaySuccesses(elem) {
    const { total, successes } = getStats();
    elem.textContent = `${successes} / ${total} successes`;
  }

})();