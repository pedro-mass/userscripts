export const MIRROR_BTN_ID = 'pam-ct-open-lichess';
export const MIRROR_BTN_LABEL = 'mirror in lichess';
const STYLE_ID = 'pam-ct-mirror-btn-style';
const UI_VERSION = '5';

export type MirrorUiState = 'idle' | 'pending' | 'live';

const C = {
  bg: '#302e2b',
  bgHover: '#363430',
  border: '#484541',
  borderHover: '#6d6a67',
  text: '#e8e6e3',
  muted: '#9a9691',
  accent: '#3692e7',
};

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 4v16" stroke="${C.muted}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M16 8l3.5 4L16 16" stroke="${C.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 8L4.5 12 8 16" stroke="${C.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function ensureMirrorButtonStyles(): void {
  const existing = document.getElementById(STYLE_ID);
  if (existing?.dataset.pamUiVersion === UI_VERSION) return;
  existing?.remove();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.dataset.pamUiVersion = UI_VERSION;
  style.textContent = `
    #${MIRROR_BTN_ID} {
      pointer-events: auto;
      cursor: pointer;
      margin: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid ${C.border};
      background: ${C.bg};
      color: ${C.muted};
      font: 400 11px/1.2 system-ui, -apple-system, Segoe UI, sans-serif;
      letter-spacing: 0.02em;
      text-transform: lowercase;
      white-space: nowrap;
      box-shadow: none;
      transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, padding 0.12s ease;
    }
    #${MIRROR_BTN_ID}:hover {
      background: ${C.bgHover};
      border-color: ${C.borderHover};
      color: ${C.text};
      padding-right: 10px;
    }
    #${MIRROR_BTN_ID}:hover .pam-ct-mirror-label,
    #${MIRROR_BTN_ID}[data-pam-mirror-state="live"] .pam-ct-mirror-label,
    #${MIRROR_BTN_ID}[data-pam-mirror-state="pending"] .pam-ct-mirror-label {
      max-width: 6rem;
      opacity: 1;
      margin-left: 2px;
    }
    #${MIRROR_BTN_ID}[data-pam-mirror-state="live"] {
      border-color: rgba(54, 146, 231, 0.45);
      color: ${C.text};
      padding-right: 10px;
    }
    #${MIRROR_BTN_ID}[data-pam-mirror-state="live"] .pam-ct-mirror-dot {
      opacity: 1;
      transform: scale(1);
    }
    #${MIRROR_BTN_ID}[data-pam-mirror-state="pending"] {
      border-style: dashed;
      border-color: ${C.borderHover};
      color: ${C.muted};
    }
    #${MIRROR_BTN_ID}:active {
      background: #2a2825;
    }
    #${MIRROR_BTN_ID}:focus-visible {
      outline: 2px solid ${C.accent};
      outline-offset: 2px;
    }
    #${MIRROR_BTN_ID} .pam-ct-mirror-icon {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
      opacity: 0.88;
    }
    #${MIRROR_BTN_ID} .pam-ct-mirror-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${C.accent};
      opacity: 0;
      transform: scale(0.6);
      transition: opacity 0.15s ease, transform 0.15s ease;
      flex-shrink: 0;
    }
    #${MIRROR_BTN_ID} .pam-ct-mirror-label {
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-width 0.15s ease, opacity 0.15s ease;
    }
  `;
  document.head.append(style);
}

const TITLES: Record<MirrorUiState, string> = {
  idle: 'Open Lichess analysis and mirror moves from ChessTempo',
  pending: 'Opening Lichess tab…',
  live: 'Mirroring live — close the Lichess tab to stop',
};

const LABELS: Record<MirrorUiState, string> = {
  idle: 'lichess',
  pending: '…',
  live: 'live',
};

export function setMirrorButtonState(
  btn: HTMLButtonElement,
  state: MirrorUiState,
): void {
  btn.dataset.pamMirrorState = state;
  btn.setAttribute('aria-label', MIRROR_BTN_LABEL);
  const label = btn.querySelector('.pam-ct-mirror-label');
  if (label) label.textContent = LABELS[state];
  btn.title = TITLES[state];
}

export function applyMirrorButtonChrome(
  btn: HTMLButtonElement,
  state: MirrorUiState = 'idle',
): void {
  ensureMirrorButtonStyles();
  btn.type = 'button';
  let icon = btn.querySelector('.pam-ct-mirror-icon');
  let dot = btn.querySelector('.pam-ct-mirror-dot');
  let label = btn.querySelector('.pam-ct-mirror-label');
  if (!icon || !label || !dot) {
    btn.replaceChildren();
    icon = document.createElement('span');
    icon.className = 'pam-ct-mirror-icon';
    dot = document.createElement('span');
    dot.className = 'pam-ct-mirror-dot';
    dot.setAttribute('aria-hidden', 'true');
    label = document.createElement('span');
    label.className = 'pam-ct-mirror-label';
    btn.append(icon, dot, label);
  }
  icon.innerHTML = ICON_SVG;
  setMirrorButtonState(btn, state);
}
