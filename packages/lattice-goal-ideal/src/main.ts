import { waitUntilTrue } from '@userscripts/shared';

waitUntilTrue(shouldRun, run);

function isPercentageBasedGoal(): boolean {
  // todo: make this actually check if there is a percentage based check?
  return true;
}

function run(): void {
  console.log('Starting Lattice Goal Percentage calculations...');
  if (!isPercentageBasedGoal()) return;

  const dates = getDates();
  const goalStats = getGoalStats();
  const percentageByDate = getRelativePercentage(
    dates.start,
    dates.end,
    dates.current,
  );

  const idealValue = Math.round(
    getRelativeValue(goalStats.start, goalStats.goal, percentageByDate),
  );

  const goalDirection = goalStats.start <= goalStats.goal ? 1 : -1;

  insertIdeal(
    idealValue,
    goalStats.unit,
    goalStats.current,
    goalDirection,
  );
}

function getRelativeValue(
  start: number,
  end: number,
  percentage: number,
): number {
  const offset = start;
  return (end - offset) * percentage + offset;
}

function getDates(): { start: number; end: number; current: number } {
  const start = getDate(/^created\n\n/i);
  const end = getDate(/^due\n\n/i);
  const current = Date.now();

  return { start, end, current };
}

function getGoalStats(): {
  start: number;
  goal: number;
  current: number;
  unit: string;
} {
  const unit = getValue(/^start: /i, 'span').replace(/\d+/, '');
  const getNumber = (regex: RegExp) =>
    Number(getValue(regex, 'span').replace(unit, ''));
  const start = getNumber(/^start: /i);
  const current = getNumber(/^current: /i);
  const goal = getNumber(/^goal: /i);

  return { start, goal, current, unit };
}

function getProgressIndicator(ideal: number, current: number): string {
  if (current == null) return '';

  if (ideal <= current) {
    return '🎉';
  }

  return '😢';
}

function insertIdeal(
  ideal: number,
  unit: string,
  current: number,
  isAscendingGoal: number,
): void {
  if (contains('span', /^ideally: /i).length > 0) {
    return;
  }

  const progressIndicator =
    isAscendingGoal > 0
      ? getProgressIndicator(ideal, current)
      : getProgressIndicator(current, ideal);

  const goalsContainer = contains('div', /^start:/i);
  const firstSpan = goalsContainer[0]?.querySelector('span');
  if (!firstSpan) return;

  const idealSpan = document.createElement('span');
  idealSpan.className = 'css-1mddpa2';

  idealSpan.appendChild(document.createTextNode('Ideally: '));

  const valueSpan = document.createElement('span');
  valueSpan.textContent = `${ideal}${unit}`;
  idealSpan.appendChild(valueSpan);

  idealSpan.appendChild(document.createTextNode(' '));

  const indicatorSpan = document.createElement('span');
  indicatorSpan.textContent = progressIndicator;
  idealSpan.appendChild(indicatorSpan);

  firstSpan.after(idealSpan);
}

function shouldRun(): boolean {
  const pageCheck = contains('span', /^start: /i);
  return pageCheck.length > 0;
}

function getRelativePercentage(
  startDate: number,
  endDate: number,
  currentDate: number,
): number {
  const offset = startDate;
  endDate = endDate - offset;
  currentDate = currentDate - offset;
  return currentDate / endDate;
}

function getDate(regex: RegExp, selector = 'div'): number {
  return new Date(getValue(regex, selector)).getTime();
}

function getValue(regex: RegExp, selector: string): string {
  return replaceString(getText(first(contains(selector, regex))), regex, '');
}

function replaceString(
  string: string,
  searchString: RegExp,
  newString: string,
): string {
  if (!string) {
    console.warn('Received bad params', { string, searchString, newString });
    return string;
  }

  return string.replace(searchString, newString);
}

function contains(selector: string, text: RegExp): HTMLElement[] {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  return Array.from(elements).filter((element) => text.test(getText(element)));
}

function getText(element: HTMLElement): string {
  return element.innerText;
}

function first<T>(arr: T[]): T {
  return arr[0];
}
