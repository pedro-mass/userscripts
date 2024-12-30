// ==UserScript==
// @name         Lichess: Training: Stats for Current Run
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  When doing puzzles, this will show you your stats
// @copyright    2024, Pedro Mass (https://github.com/pedro-mass)
// @author       pedro-mass
// @match        https://lichess.org/training/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lichess.org
// @grant        none
// @run-at       document-idle

const selectors = {
  results: ".result-empty",
  stats: "#pm-stats",
  puzzleHolder: ".puzzle__session",
};
const constants = {
  failure: "result-false",
  success: "result-true",
};

// waitForKeyElements(selectors.results, run);
wait_element(document, selectors.results).then(run);

// helper functions

// src: https://stackoverflow.com/a/47406751/2911615
function wait_element(root, selector) {
  return new Promise((resolve, reject) => {
    new MutationObserver(check).observe(root, {
      childList: true,
      subtree: true,
    });
    function check(changes, observer) {
      let element = root.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    }
  });
}

function run() {
  console.log({
    fn: "run",
    msg: "starting",
  });
  const statsElem = getStatsElem();
  displayFailures(statsElem);
  let showFailures = true;

  statsElem.addEventListener("click", function flipDisplay() {
    showFailures ? displayFailures(statsElem) : displaySuccesses(statsElem);

    showFailures = !showFailures;
  });
}

function getResults() {
  return Array.from(document.querySelectorAll(selectors.results));
}

function getStatsElem() {
  return document.querySelector(selectors.stats) ?? createStatsElem();
}

function createStatsElem() {
  const statsElem = document.createElement("div");
  statsElem.id = "pm-stats";
  document.querySelector(selectors.puzzleHolder).appendChild(statsElem);

  return statsElem;
}

function getStats() {
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
}

function displayFailures(elem) {
  const { total, failures } = getStats();

  elem.textContent = `${failures} / ${total} failures`;
}

function displaySuccesses(elem) {
  const { total, successes } = getStats();

  elem.textContent = `${successes} / ${total} successes`;
}
