import { waitForElement, watchElement } from '@userscripts/shared';
import { constants, ids, selectors } from './config';

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

function wasTextChange(changes: MutationRecord[]): boolean {
  if (changes.length === 0) return false;

  const firstChange = changes[0];
  return (
    firstChange.target instanceof HTMLElement &&
    firstChange.target.id === ids.stats &&
    firstChange.type === 'childList'
  );
}

function run(): void {
  const statsElem = getStatsElem();
  displayFailures(statsElem);

  if (clickListenerAttached) return;
  clickListenerAttached = true;

  statsElem.addEventListener('click', () => {
    showFailures = !showFailures;
    if (showFailures) {
      displayFailures(statsElem);
    } else {
      displaySuccesses(statsElem);
    }
  });
}

function getResults(): Element[] {
  return Array.from(document.querySelectorAll(selectors.results));
}

function getStatsElem(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(selectors.stats);
  if (existing) return existing;
  return createStatsElem();
}

function createStatsElem(): HTMLElement {
  const statsElem = document.createElement('div');
  statsElem.id = ids.stats;

  const puzzleHolder = document.querySelector(selectors.puzzleHolder);
  if (!puzzleHolder) {
    throw new Error('lichess-stats: puzzle holder not found');
  }

  puzzleHolder.appendChild(statsElem);
  return statsElem;
}

function getStats(): { total: number; failures: number; successes: number } {
  const results = getResults();
  const failures = results.filter((element) =>
    element.classList.contains(constants.failure),
  ).length;
  const successes = results.filter((element) =>
    element.classList.contains(constants.success),
  ).length;

  return { total: results.length, failures, successes };
}

function displayFailures(elem: HTMLElement): void {
  const { total, failures } = getStats();
  elem.textContent = `${failures} / ${total} failures`;
}

function displaySuccesses(elem: HTMLElement): void {
  const { total, successes } = getStats();
  elem.textContent = `${successes} / ${total} successes`;
}
