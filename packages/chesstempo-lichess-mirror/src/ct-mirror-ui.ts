export const MIRROR_BTN_ID = 'pam-ct-open-lichess';
export const MIRROR_BTN_LABEL = 'mirror in lichess';
const STYLE_ID = 'pam-ct-mirror-btn-style';
const UI_VERSION = '4';

/** Lichess site chrome: flat dark panel, cream text, blue on links/icons only. */
const C = {
  bg: '#302e2b',
  bgHover: '#363430',
  border: '#484541',
  borderHover: '#6d6a67',
  text: '#e8e6e3',
  muted: '#bababa',
  accent: '#3692e7',
};

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 4v16" stroke="${C.muted}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M16 8l3.5 4L16 16" stroke="${C.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 8L4.5 12 8 16" stroke="${C.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="5" y="6" width="5" height="12" rx="1" fill="${C.muted}" fill-opacity="0.18"/>
  <rect x="14" y="6" width="5" height="12" rx="1" fill="${C.text}" fill-opacity="0.1"/>
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
      gap: 8px;
      padding: 9px 14px 9px 11px;
      border-radius: 6px;
      border: 1px solid ${C.border};
      background: ${C.bg};
      color: ${C.text};
      font: 500 13px/1.25 system-ui, -apple-system, Segoe UI, sans-serif;
      letter-spacing: 0.01em;
      text-transform: lowercase;
      white-space: nowrap;
      box-shadow: none;
      transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
    }
    #${MIRROR_BTN_ID}:hover {
      background: ${C.bgHover};
      border-color: ${C.borderHover};
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
      opacity: 0.95;
    }
    #${MIRROR_BTN_ID} .pam-ct-mirror-label {
      padding-right: 1px;
    }
  `;
  document.head.append(style);
}

const DEFAULT_TITLE = 'Open Lichess analysis and mirror moves from ChessTempo';

export function applyMirrorButtonChrome(btn: HTMLButtonElement): void {
  ensureMirrorButtonStyles();
  btn.type = 'button';
  let icon = btn.querySelector('.pam-ct-mirror-icon');
  let label = btn.querySelector('.pam-ct-mirror-label');
  if (!icon || !label) {
    btn.replaceChildren();
    icon = document.createElement('span');
    icon.className = 'pam-ct-mirror-icon';
    label = document.createElement('span');
    label.className = 'pam-ct-mirror-label';
    btn.append(icon, label);
  }
  icon.innerHTML = ICON_SVG;
  label.textContent = MIRROR_BTN_LABEL;
  btn.title = btn.title || DEFAULT_TITLE;
}
