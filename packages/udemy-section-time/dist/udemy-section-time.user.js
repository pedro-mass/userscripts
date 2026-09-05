// ==UserScript==
// @name         Udemy - show section time
// @namespace    https://github.com/pedro-mass/userscripts/udemy-section-time
// @version      1.4.0
// @author       pedro-mass
// @description  For Udemy, displays the time a section has ( remaining time / total time).
// @downloadURL  https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/udemy-section-time/dist/udemy-section-time.user.js
// @updateURL    https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/udemy-section-time/dist/udemy-section-time.meta.js
// @match        https://*.udemy.com/*
// @match        http://*.udemy.com/*
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
  const classes = {
    sectionTime: "section-time",
    lectureProgressTime: "lecture-progress-time"
  };
  const selectors = {
    sectionCard: "[class^=section--section--] > .panel-body",
    sectionHeader: "[class^=section--section-heading--]",
    sectionProgress: "[class^=section--section-heading--] > .text-secondary",
    sectionTime: `.${classes.sectionTime}`,
    lectureItem: "[class^=curriculum-item--curriculum-item--]",
    lectureTime: "[class^=curriculum-item--duration--]",
    lectureProgress: "#top-detail > div.detail__progress > div > div.fx",
    lectureCompleted: "[class^=curriculum-item--is-completed]"
  };
  waitForElement(document, selectors.sectionCard).then(() => {
    run();
    watchElement(document.body, (changes) => {
      if (wasOurChange(changes)) return;
      run();
    });
  });
  function wasOurChange(changes) {
    for (const change of changes) {
      const nodes = [
        ...Array.from(change.addedNodes),
        ...Array.from(change.removedNodes)
      ];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList.contains(classes.sectionTime) || node.classList.contains(classes.lectureProgressTime)) {
          return true;
        }
      }
    }
    return false;
  }
  function run() {
    const sections = document.querySelectorAll(selectors.sectionCard);
    let totalLectureTime = 0;
    let remainingLectureTime = 0;
    for (const section of Array.from(sections)) {
      Array.from(section.querySelectorAll(selectors.sectionTime)).forEach(
        (el) => el.remove()
      );
      const totalTimeTexts = getTimeTexts(section, false);
      const totalTimeSeconds = textTimesToSeconds(totalTimeTexts);
      const totalTime = secondsToTextTime(totalTimeSeconds);
      totalLectureTime += totalTimeSeconds;
      let textToDisplay = totalTime;
      if (checkPartialTime(section)) {
        const partialTimeTexts = getTimeTexts(section, true);
        const partialTimeSeconds = textTimesToSeconds(partialTimeTexts);
        const partialTime = secondsToTextTime(partialTimeSeconds);
        remainingLectureTime += partialTimeSeconds;
        textToDisplay = `${partialTime} / ${textToDisplay}`;
      }
      if (getRemainingParts(section) === 0) {
        remainingLectureTime += totalTimeSeconds;
      }
      displaySectionTime(section, textToDisplay);
    }
    displayLectureTimeProgress(totalLectureTime, remainingLectureTime);
  }
  function displayLectureTimeProgress(totalLectureTime, remainingLectureTime) {
    var _a;
    let displayText = secondsToTextTime(totalLectureTime);
    if (remainingLectureTime) {
      displayText = `${secondsToTextTime(remainingLectureTime)} / ${displayText}`;
    }
    displayText = `(${displayText})`;
    const lectureProgress = document.querySelector(selectors.lectureProgress);
    if (!lectureProgress) return displayText;
    const existing = lectureProgress.querySelector(
      `.${classes.lectureProgressTime}`
    );
    if (existing) {
      existing.textContent = displayText;
      return displayText;
    }
    const childDiv = lectureProgress.querySelector(":scope > div");
    if (!childDiv) return displayText;
    const span = document.createElement("span");
    span.className = classes.lectureProgressTime;
    span.style.marginLeft = "1em";
    span.textContent = displayText;
    (_a = childDiv.parentNode) == null ? void 0 : _a.insertBefore(span, childDiv);
    return displayText;
  }
  function checkPartialTime(section) {
    const sectionParts = getSectionParts(section);
    const sectionsToGo = sectionParts[0];
    const totalSections = sectionParts[1];
    return sectionsToGo !== 0 && sectionsToGo != totalSections;
  }
  function getRemainingParts(section) {
    const sectionParts = getSectionParts(section);
    return sectionParts[0];
  }
  function getTimeTexts(section, isPartialTime) {
    let lectures = Array.from(section.querySelectorAll(selectors.lectureItem));
    if (isPartialTime) {
      lectures = lectures.filter(
        (element) => !element.querySelector(selectors.lectureCompleted)
      );
    }
    const timeSpans = lectures.flatMap(
      (lecture) => Array.from(lecture.querySelectorAll(selectors.lectureTime))
    );
    return timeSpans.map((span) => span.textContent ?? "");
  }
  function displaySectionTime(section, displayText) {
    const location = section.querySelector(selectors.sectionHeader);
    if (!location) return;
    const existing = location.querySelector(selectors.sectionTime);
    if (existing) {
      existing.textContent = displayText;
      return;
    }
    const span = document.createElement("span");
    span.className = classes.sectionTime;
    span.style.position = "absolute";
    span.style.right = "10%";
    span.textContent = displayText;
    location.prepend(span);
  }
  function getSectionParts(section) {
    const progress = section.querySelector(selectors.sectionProgress);
    if (!(progress == null ? void 0 : progress.textContent)) return [];
    return progress.textContent.split("/").map((text) => text.trim());
  }
  function convertTextToSeconds(textTime) {
    if (!textTime || textTime.trim().length === 0) return 0;
    const timeParts = textTime.split(":");
    let seconds = parseInt(timeParts[1], 10);
    seconds += parseInt(timeParts[0], 10) * 60;
    return seconds;
  }
  function textTimesToSeconds(textTimes) {
    return textTimes.reduce(
      (totalSeconds, textTime) => totalSeconds + convertTextToSeconds(textTime),
      0
    );
  }
  function secondsToTextTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 60 / 60);
    let remainingTime = totalSeconds - hours * 60 * 60;
    const minutes = Math.floor(remainingTime / 60);
    remainingTime = remainingTime - minutes * 60;
    const seconds = remainingTime;
    return getTime(hours, minutes, seconds);
  }
  function getTime(hours, minutes, seconds) {
    let result = "";
    if (hours > 0) {
      result += `${hours}:`;
      result += timePad(minutes);
    } else {
      result += String(minutes);
    }
    if (minutes > 0) {
      result += `:${timePad(seconds)}`;
    } else {
      result += `0:${timePad(seconds)}`;
    }
    return result;
  }
  function timePad(timeSegment) {
    let result = String(timeSegment);
    while (result.length < 2) {
      result = `0${result}`;
    }
    return result;
  }

})();