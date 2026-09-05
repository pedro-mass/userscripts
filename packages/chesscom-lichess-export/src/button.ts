import {
  BUTTON_ANCHOR_SELECTORS,
  SHARE_MODAL_SELECTORS,
  WIN_MODAL_TEXT,
} from './config';
import { MAIN_LABELS, SHARE_LABELS, type ButtonState } from './ui/labels';

const NS = `pam_lichess_${Math.random().toString(36).slice(2, 10)}`;
const STYLE_ID = `${NS}_style`;

export type { ButtonState };

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

/** Fallback when chess.com renames classes — walk from "You Won!" text. */
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
  btn.className = 'pam-lichess-btn';
  btn.textContent = MAIN_LABELS[initialState];
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
  btn.textContent = MAIN_LABELS[state];
  btn.disabled = state === 'loading';
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .pam-lichess-btn,
    .pam-lichess-share-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: 6px;
      border-radius: 6px;
      font-family: inherit;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .pam-lichess-btn {
      padding: 11px 16px;
      border: 1px solid #81b64c;
      background: #2b2a28;
      color: #f0ede8;
      font-size: 15px;
    }
    [data-cy="game-over-modal-shell-buttons"] .pam-lichess-btn,
    .game-over-modal-shell-buttons .pam-lichess-btn {
      width: auto;
      min-width: 12rem;
      max-width: calc(100% - 3.2rem);
      margin: 6px 1.6rem 0;
    }
    .pam-lichess-btn:hover:not(:disabled) {
      background: #363532;
      border-color: #9bc964;
    }
    .pam-lichess-share-btn {
      padding: 10px 14px;
      border: 1px dashed #81b64c;
      background: transparent;
      color: #c5e1a5;
      font-size: 14px;
    }
    .pam-lichess-share-btn:hover:not(:disabled) {
      background: rgba(129, 182, 76, 0.12);
      border-style: solid;
    }
    .pam-lichess-btn:disabled,
    .pam-lichess-share-btn:disabled {
      opacity: 0.6;
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
  btn.className = 'pam-lichess-share-btn';
  btn.textContent = SHARE_LABELS.idle;
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
  btn.textContent = SHARE_LABELS[state];
  btn.disabled = state === 'loading';
}
