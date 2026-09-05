import { debounce, toNumber } from './utils';

const STORAGE_KEY = 'pm_min_rating';

init();

function init(): void {
  addFilterUI();
}

function addFilterUI(): void {
  const container = document.querySelector('.options-bar-v2');
  if (!container) return;

  const existingUI = document.querySelector('.pm-rating-filter');
  if (existingUI) existingUI.remove();

  const label = document.createElement('label');
  label.textContent = 'Minimum Rating:';
  label.classList.add('pm-rating-filter', 'option-v2');
  Object.assign(label.style, {
    display: 'flex',
    gap: '0.5em',
    alignItems: 'center',
    fontFamily: 'sans-serif',
    fontSize: '0.9em',
  });

  const input = Object.assign(document.createElement('input'), {
    type: 'number',
    placeholder: '7.6',
    min: '0',
    max: '10',
    step: '0.1',
    id: 'pm-rating-input',
    value: localStorage.getItem(STORAGE_KEY) || '',
  });
  Object.assign(input.style, {
    width: '4em',
    padding: '0.25em 0.35em',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.9em',
    transition: 'border-color 0.2s',
    backgroundColor: '#fff',
  });
  label.htmlFor = input.id;
  label.appendChild(input);

  const filters = container.querySelectorAll('.option-v2.hide-for-small-only');
  const lastFilter = filters[filters.length - 1];
  if (!lastFilter) {
    console.error('Could NOT find the filters to add onto');
    return;
  }
  lastFilter.after(label);

  input.addEventListener(
    'input',
    debounce((event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = toNumber(target.value, 0);
      filterAnimes(value);
      localStorage.setItem(STORAGE_KEY, String(value));
    }, 300),
  );

  const savedValue = toNumber(localStorage.getItem(STORAGE_KEY), 0);
  if (savedValue > 0) {
    filterAnimes(savedValue);
  }
}

function filterAnimes(minRating = 0): void {
  const animes = document.querySelectorAll('.anime');
  animes.forEach((anime) => {
    const ratingEl = anime.querySelector('.anime-avg-user-rating');
    const rating =
      parseFloat((ratingEl as HTMLElement | null)?.innerText ?? '') || 0;
    if (rating < minRating) {
      hide(anime as HTMLElement);
    } else {
      show(anime as HTMLElement);
    }
  });
}

function hide(element: HTMLElement): void {
  element.style.display = 'none';
}

function show(element: HTMLElement): void {
  element.style.display = '';
}
