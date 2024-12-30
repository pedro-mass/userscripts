// ==UserScript==
// @name         Lichess: Training: Stats for Current Run
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  When doing puzzles, this will show you your stats
// @copyright    2024, Pedro Mass (https://github.com/pedro-mass)
// @author       pedro-mass
// @match        https://lichess.org/training/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lichess.org
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const selectors = {
    results: ".result-empty",
    stats: "#pm-stats",
    puzzleHolder: ".puzzle__session",
  };
  const constants = {
    failure: "result-false",
    success: "result-true",
  };

  const getResults = () =>
    Array.from(document.querySelectorAll(selectors.results));

  const getStatsElem = () =>
    document.querySelector(selectors.stats) ?? createStatsElem();

  const createStatsElem = () => {
    const statsElem = document.createElement("div");
    statsElem.id = "pm-stats";
    document.querySelector(selectors.puzzleHolder).appendChild(statsElem);

    return statsElem;
  };

  const getStats = () => {
    const results = getResults();
    const failures = results.filter((x) =>
      Array.from(x.classList).includes(constants.failure)
    );
    const successes = results.filter((x) =>
      Array.from(x.classList).includes(constants.success)
    );

    return {
      total: results.length,
      failures: failures.length,
      successes: successes.length,
    };
  };

  const displayFailures = (elem) => {
    const { total, failures } = getStats();

    elem.textContent = `${failures} / ${total} failures`;
  };

  const displaySuccesses = (elem) => {
    const { total, successes } = getStats();

    elem.textContent = `${successes} / ${total} successes`;
  };

  const statsElem = getStatsElem();
  displayFailures(statsElem);
  let showFailures = true;

  statsElem.addEventListener("click", function flipDisplay() {
    showFailures ? displayFailures(statsElem) : displaySuccesses(statsElem);

    showFailures = !showFailures;
  });
})();
