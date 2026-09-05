// ==UserScript==
// @name         Lattice Goals - Add Ideal
// @namespace    https://github.com/pedro-mass/userscripts/lattice-goal-ideal
// @version      1.4
// @author       pedro-mass
// @description  Determines ideal goal value based on Created on and Due dates
// @downloadURL  https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lattice-goal-ideal/dist/lattice-goal-ideal.user.js
// @updateURL    https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lattice-goal-ideal/dist/lattice-goal-ideal.meta.js
// @match        http://*.latticehq.com/goals/*
// @match        https://*.latticehq.com/goals/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  function waitUntilTrue(checkFn, cb = () => {
  }, timeout = 250) {
    const intervalId = setInterval(() => {
      if (checkFn()) {
        clearInterval(intervalId);
        cb();
      }
    }, timeout);
  }
  waitUntilTrue(shouldRun, run);
  function run() {
    console.log("Starting Lattice Goal Percentage calculations...");
    const dates = getDates();
    const goalStats = getGoalStats();
    const percentageByDate = getRelativePercentage(
      dates.start,
      dates.end,
      dates.current
    );
    const idealValue = Math.round(
      getRelativeValue(goalStats.start, goalStats.goal, percentageByDate)
    );
    const goalDirection = goalStats.start <= goalStats.goal ? 1 : -1;
    insertIdeal(
      idealValue,
      goalStats.unit,
      goalStats.current,
      goalDirection
    );
  }
  function getRelativeValue(start, end, percentage) {
    const offset = start;
    return (end - offset) * percentage + offset;
  }
  function getDates() {
    const start = getDate(/^created\n\n/i);
    const end = getDate(/^due\n\n/i);
    const current = Date.now();
    return { start, end, current };
  }
  function getGoalStats() {
    const unit = getValue(/^start: /i, "span").replace(/\d+/, "");
    const getNumber = (regex) => Number(getValue(regex, "span").replace(unit, ""));
    const start = getNumber(/^start: /i);
    const current = getNumber(/^current: /i);
    const goal = getNumber(/^goal: /i);
    return { start, goal, current, unit };
  }
  function getProgressIndicator(ideal, current) {
    if (current == null) return "";
    if (ideal <= current) {
      return "🎉";
    }
    return "😢";
  }
  function insertIdeal(ideal, unit, current, isAscendingGoal) {
    var _a;
    if (contains("span", /^ideally: /i).length > 0) {
      return;
    }
    const progressIndicator = isAscendingGoal > 0 ? getProgressIndicator(ideal, current) : getProgressIndicator(current, ideal);
    const goalsContainer = contains("div", /^start:/i);
    const firstSpan = (_a = goalsContainer[0]) == null ? void 0 : _a.querySelector("span");
    if (!firstSpan) return;
    const idealSpan = document.createElement("span");
    idealSpan.className = "css-1mddpa2";
    idealSpan.appendChild(document.createTextNode("Ideally: "));
    const valueSpan = document.createElement("span");
    valueSpan.textContent = `${ideal}${unit}`;
    idealSpan.appendChild(valueSpan);
    idealSpan.appendChild(document.createTextNode(" "));
    const indicatorSpan = document.createElement("span");
    indicatorSpan.textContent = progressIndicator;
    idealSpan.appendChild(indicatorSpan);
    firstSpan.after(idealSpan);
  }
  function shouldRun() {
    const pageCheck = contains("span", /^start: /i);
    return pageCheck.length > 0;
  }
  function getRelativePercentage(startDate, endDate, currentDate) {
    const offset = startDate;
    endDate = endDate - offset;
    currentDate = currentDate - offset;
    return currentDate / endDate;
  }
  function getDate(regex, selector = "div") {
    return new Date(getValue(regex, selector)).getTime();
  }
  function getValue(regex, selector) {
    return replaceString(getText(first(contains(selector, regex))), regex, "");
  }
  function replaceString(string, searchString, newString) {
    if (!string) {
      console.warn("Received bad params", { string, searchString, newString });
      return string;
    }
    return string.replace(searchString, newString);
  }
  function contains(selector, text) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).filter((element) => text.test(getText(element)));
  }
  function getText(element) {
    return element.innerText;
  }
  function first(arr) {
    return arr[0];
  }

})();