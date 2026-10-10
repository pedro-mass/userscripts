export const MIRROR_BTN_ID = 'pam-ct-open-lichess';
export const MIRROR_BTN_LABEL = 'mirror in lichess';
const STYLE_ID = 'pam-ct-mirror-btn-style';
const UI_VERSION = '2';

/** Lichess dark UI + board greens (site palette, not official assets). */
const C = {
  bg: '#302e2b',
  bgHover: '#363430',
  border: '#484541',
  borderHover: '#629924',
  text: '#e8e6e3',
  green: '#629924',
  boardLight: '#baca44',
  boardDark: '#769656',
  focus: '#3692e7',
};

/** Horizontal flip / mirror (chevrons toward center axis). */
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 4v16" stroke="${C.boardDark}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M16 8l3.5 4L16 16" stroke="${C.boardLight}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 8L4.5 12 8 16" stroke="${C.boardLight}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="5" y="6" width="5" height="12" rx="1" fill="${C.boardDark}" fill-opacity="0.35"/>
  <rect x="14" y="6" width="5" height="12" rx="1" fill="${C.boardLight}" fill-opacity="0.28"/>
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
      gap: 9px;
      padding: 10px 16px 10px 12px;
      border-radius: 999px;
      border: 1px solid ${C.border};
      background: linear-gradient(180deg, ${C.bg} 0%, #262421 100%);
      color: ${C.text};
      font: 600 13px/1.2 system-ui, -apple-system, Segoe UI, sans-serif;
      letter-spacing: 0.02em;
      text-transform: lowercase;
      white-space: nowrap;
      box-shadow:
        0 4px 14px rgba(0, 0, 0, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    #${MIRROR_BTN_ID}:hover {
      background: linear-gradient(180deg, ${C.bgHover} 0%, #2a2825 100%);
      border-color: ${C.borderHover};
      transform: translateY(-1px);
      box-shadow:
        0 6px 18px rgba(98, 153, 36, 0.22),
        0 4px 12px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    #${MIRROR_BTN_ID}:active {
      transform: translateY(0);
    }
    #${MIRROR_BTN_ID}:focus-visible {
      outline: 2px solid ${C.focus};
      outline-offset: 3px;
    }
    #${MIRROR_BTN_ID} .pam-ct-mirror-icon {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
    }
    #${MIRROR_BTN_ID} .pam-ct-mirror-label {
      padding-right: 2px;
    }
  `;
  document.head.append(style);
}

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
  if (!btn.title) {
    btn.title =
      'Open Lichess analysis at this position and mirror further moves from ChessTempo';
  }
}
