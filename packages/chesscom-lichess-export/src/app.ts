import { analyseOnLichess } from './analyseOnLichess';
import {
  cleanupButtons,
  injectMainButton,
  injectShareModalButton,
  isMainButtonInjected,
  setMainButtonState,
  setShareModalButtonState,
  type ButtonState,
} from './button';
import {
  ABORTED_GAME_SELECTORS,
  GAME_PATH_FRAGMENTS,
  SHARE_MODAL_SELECTORS,
} from './config';
import { extractGameId, getStoredLichessUrl } from './storage';

let pollInterval: ReturnType<typeof setInterval> | null = null;

function isOnGamePage(): boolean {
  return GAME_PATH_FRAGMENTS.some((fragment) =>
    window.location.pathname.includes(fragment),
  );
}

function isGameAborted(): boolean {
  return ABORTED_GAME_SELECTORS.some(
    (selector) => document.querySelector(selector) !== null,
  );
}

function initialButtonState(): ButtonState {
  const id = extractGameId();
  return id && getStoredLichessUrl(id) ? 'cached' : 'idle';
}

async function runExport(
  setState: (state: ButtonState) => void,
): Promise<void> {
  setState('loading');
  try {
    await analyseOnLichess();
    setState('cached');
  } catch (err) {
    console.error('[chesscom-lichess-export]', err);
    setState('error');
    const id = extractGameId();
    const fallback = id && getStoredLichessUrl(id) ? 'cached' : 'idle';
    setTimeout(() => setState(fallback), 3000);
  }
}

function tickMainButton(): void {
  if (!isOnGamePage() || isGameAborted() || isMainButtonInjected()) return;

  injectMainButton(() => {
    void runExport(setMainButtonState);
  }, initialButtonState());
}

function tickShareModalButton(): void {
  if (!isOnGamePage()) return;
  if (!document.querySelector(SHARE_MODAL_SELECTORS.modal)) return;

  injectShareModalButton(() => {
    void runExport(setShareModalButtonState);
  });
}

export function startApp(): void {
  if (pollInterval) return;

  pollInterval = setInterval(() => {
    tickMainButton();
    tickShareModalButton();
  }, 500);

  tickMainButton();
  tickShareModalButton();
}

export function cleanupApp(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  cleanupButtons();
}
