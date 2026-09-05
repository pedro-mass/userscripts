import { waitForElement, watchElement } from '@userscripts/shared';
import { classes, selectors } from './config';

waitForElement(document, selectors.sectionCard).then(() => {
  run();
  watchElement(document.body, (changes) => {
    if (wasOurChange(changes)) return;
    run();
  });
});

function wasOurChange(changes: MutationRecord[]): boolean {
  for (const change of changes) {
    const nodes = [
      ...Array.from(change.addedNodes),
      ...Array.from(change.removedNodes),
    ];
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (
        node.classList.contains(classes.sectionTime) ||
        node.classList.contains(classes.lectureProgressTime)
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Gets total and remaining time for each section.
 * Displays these per section.
 * Display the total of all sections
 */
function run(): void {
  const sections = document.querySelectorAll(selectors.sectionCard);

  let totalLectureTime = 0;
  let remainingLectureTime = 0;

  for (const section of Array.from(sections)) {
    Array.from(section.querySelectorAll(selectors.sectionTime)).forEach((el) =>
      el.remove(),
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

function displayLectureTimeProgress(
  totalLectureTime: number,
  remainingLectureTime: number,
): string {
  let displayText = secondsToTextTime(totalLectureTime);

  if (remainingLectureTime) {
    displayText = `${secondsToTextTime(remainingLectureTime)} / ${displayText}`;
  }

  displayText = `(${displayText})`;

  const lectureProgress = document.querySelector(selectors.lectureProgress);
  if (!lectureProgress) return displayText;

  const existing = lectureProgress.querySelector<HTMLElement>(
    `.${classes.lectureProgressTime}`,
  );
  if (existing) {
    existing.textContent = displayText;
    return displayText;
  }

  const childDiv = lectureProgress.querySelector(':scope > div');
  if (!childDiv) return displayText;

  const span = document.createElement('span');
  span.className = classes.lectureProgressTime;
  span.style.marginLeft = '1em';
  span.textContent = displayText;
  childDiv.parentNode?.insertBefore(span, childDiv);

  return displayText;
}

function checkPartialTime(section: Element): boolean {
  const sectionParts = getSectionParts(section);
  const sectionsToGo = sectionParts[0];
  const totalSections = sectionParts[1];

  return sectionsToGo !== 0 && sectionsToGo != totalSections;
}

function getRemainingParts(section: Element): number | string {
  const sectionParts = getSectionParts(section);
  return sectionParts[0];
}

function getTimeTexts(section: Element, isPartialTime: boolean): string[] {
  let lectures = Array.from(section.querySelectorAll(selectors.lectureItem));

  if (isPartialTime) {
    lectures = lectures.filter(
      (element) => !element.querySelector(selectors.lectureCompleted),
    );
  }

  const timeSpans = lectures.flatMap((lecture) =>
    Array.from(lecture.querySelectorAll(selectors.lectureTime)),
  );

  return timeSpans.map((span) => span.textContent ?? '');
}

function displaySectionTime(section: Element, displayText: string): void {
  const location = section.querySelector(selectors.sectionHeader);
  if (!location) return;

  const existing = location.querySelector<HTMLElement>(selectors.sectionTime);
  if (existing) {
    existing.textContent = displayText;
    return;
  }

  const span = document.createElement('span');
  span.className = classes.sectionTime;
  span.style.position = 'absolute';
  span.style.right = '10%';
  span.textContent = displayText;
  location.prepend(span);
}

function getSectionParts(section: Element): (number | string)[] {
  const progress = section.querySelector(selectors.sectionProgress);
  if (!progress?.textContent) return [];

  return progress.textContent.split('/').map((text) => text.trim());
}

function convertTextToSeconds(textTime: string): number {
  if (!textTime || textTime.trim().length === 0) return 0;

  const timeParts = textTime.split(':');
  let seconds = parseInt(timeParts[1], 10);
  seconds += parseInt(timeParts[0], 10) * 60;

  return seconds;
}

function textTimesToSeconds(textTimes: string[]): number {
  return textTimes.reduce(
    (totalSeconds, textTime) => totalSeconds + convertTextToSeconds(textTime),
    0,
  );
}

function secondsToTextTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 60 / 60);
  let remainingTime = totalSeconds - hours * 60 * 60;
  const minutes = Math.floor(remainingTime / 60);
  remainingTime = remainingTime - minutes * 60;
  const seconds = remainingTime;

  return getTime(hours, minutes, seconds);
}

function getTime(hours: number, minutes: number, seconds: number): string {
  let result = '';

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

function timePad(timeSegment: number): string {
  let result = String(timeSegment);

  while (result.length < 2) {
    result = `0${result}`;
  }

  return result;
}
