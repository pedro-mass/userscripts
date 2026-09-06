import lichessLogoSvg from './assets/lichess-logo.svg?raw';
import {
  BUTTON_ANCHOR_SELECTORS,
  SHARE_MODAL_SELECTORS,
  WIN_MODAL_TEXT,
} from './config';
import { LICHESS_THEME } from './ui/lichess-theme';

const NS = `cc2l_${Math.random().toString(36).slice(2, 10)}`;
const STYLE_ID = `${NS}_style`;

export type ButtonState = 'idle' | 'cached' | 'loading' | 'error';

const BUTTON_CONTENT: Record<ButtonState, string> = {
  idle: `${lichessLogoSvg} Analyse on Lichess`,
  cached: `${lichessLogoSvg} Re-open on Lichess ✓`,
  loading: '⏳ Importing…',
  error: '❌ Failed — retry?',
};

const SHARE_IDLE = `${lichessLogoSvg} Export to Lichess`;

export function isMainButtonInjected(): boolean {
  return document.getElementById(NS) !== null;
}

function findButtonAnchor(): HTMLElement | null {
  for (const selector of BUTTON_ANCHOR_SELECTORS) {
    const anchor = document.querySelector<HTMLElement>(selector);
    if (anchor) return anchor;
  }
  return findWinModalAnchorByText();
}

function findWinModalAnchorByText(): HTMLElement | null {
  for (const phrase of WIN_MODAL_TEXT) {
    const heading = Array.from(document.querySelectorAll<HTMLElement>('*')).find(
      (el) => {
        const ownText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent?.trim() ?? '')
          .join('');
        return ownText.includes(phrase);
      },
    );
    if (!heading) continue;

    let candidate: HTMLElement | null = heading;
    for (let i = 0; i < 8 && candidate; i++) {
      candidate = candidate.parentElement;
      if (!candidate) break;
      const reviewBtn = Array.from(
        candidate.querySelectorAll<HTMLElement>('button, a, [role="button"]'),
      ).find((el) => /game review/i.test(el.textContent ?? ''));
      if (reviewBtn?.parentElement) return reviewBtn.parentElement;
    }
  }
  return null;
}

export function injectMainButton(
  onClick: () => void,
  initialState: ButtonState = 'idle',
): boolean {
  const anchor = findButtonAnchor();
  if (!anchor) return false;

  const btn = document.createElement('button');
  btn.id = NS;
  btn.type = 'button';
  btn.className = 'cc2l-btn';
  btn.innerHTML = BUTTON_CONTENT[initialState];
  btn.addEventListener('click', onClick);

  const secondaryActions = anchor.querySelector(
    '.game-over-secondary-actions-row-component',
  );
  if (secondaryActions) {
    anchor.insertBefore(btn, secondaryActions);
  } else {
    anchor.appendChild(btn);
  }

  injectStyles();
  return true;
}

export function setMainButtonState(state: ButtonState): void {
  const btn = document.getElementById(NS) as HTMLButtonElement | null;
  if (!btn) return;
  btn.innerHTML = BUTTON_CONTENT[state];
  btn.disabled = state === 'loading';
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .cc2l-btn,
    .cc2l-share-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      border: 1px solid ${LICHESS_THEME.border};
      border-radius: ${LICHESS_THEME.radius};
      background: linear-gradient(
        to bottom,
        ${LICHESS_THEME.metalTop},
        ${LICHESS_THEME.metalBottom}
      );
      color: ${LICHESS_THEME.bragText};
      font-weight: 500;
      text-shadow: ${LICHESS_THEME.textShadow};
      box-shadow: ${LICHESS_THEME.buttonShadow};
      cursor: pointer;
      transition: filter 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
      font-family: inherit;
    }
    .cc2l-btn {
      padding: 2rem 4rem;
      margin-top: 8px;
      font-size: 22px;
    }
    [data-cy="game-over-modal-shell-buttons"] .cc2l-btn,
    .game-over-modal-shell-buttons .cc2l-btn {
      padding: 1.3rem 2rem;
      margin-top: 8px;
    }
    .cc2l-btn svg,
    .cc2l-share-btn svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    .cc2l-share-btn {
      margin-top: 12px;
      padding: 12px 16px;
      font-size: 16px;
    }
    .cc2l-share-btn svg {
      width: 20px;
      height: 20px;
    }
    .cc2l-btn:hover:not(:disabled),
    .cc2l-share-btn:hover:not(:disabled) {
      filter: brightness(1.12);
    }
    .cc2l-btn:disabled,
    .cc2l-share-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

export function injectShareModalButton(onClick: () => void): void {
  const modal = document.querySelector<HTMLElement>(SHARE_MODAL_SELECTORS.modal);
  if (!modal || modal.querySelector(`#${SHARE_MODAL_SELECTORS.injectId}`)) return;

  const downloadBtn = Array.from(modal.querySelectorAll('button')).find((btn) =>
    /download/i.test(btn.textContent ?? ''),
  );

  const btn = document.createElement('button');
  btn.id = SHARE_MODAL_SELECTORS.injectId;
  btn.type = 'button';
  btn.className = 'cc2l-share-btn';
  btn.innerHTML = SHARE_IDLE;
  btn.addEventListener('click', onClick);

  injectStyles();

  if (downloadBtn?.parentElement) {
    downloadBtn.parentElement.insertBefore(btn, downloadBtn);
  } else {
    modal.appendChild(btn);
  }
}

export function setShareModalButtonState(state: ButtonState): void {
  const btn = document.getElementById(
    SHARE_MODAL_SELECTORS.injectId,
  ) as HTMLButtonElement | null;
  if (!btn) return;
  btn.innerHTML = state === 'idle' ? SHARE_IDLE : BUTTON_CONTENT[state];
  btn.disabled = state === 'loading';
}
