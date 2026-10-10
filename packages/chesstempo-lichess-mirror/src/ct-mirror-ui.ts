export const MIRROR_BTN_ID = 'pam-ct-open-lichess';
export const MIRROR_BTN_LABEL = 'mirror in lichess';
const STYLE_ID = 'pam-ct-mirror-btn-style';
const UI_VERSION = '5';
const ICON_STORAGE_KEY = 'pamCtMirrorIcon';

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

export const MIRROR_ICON_VARIANTS = [
  'flip',
  'external',
  'sync',
  'split',
  'arrow',
] as const;

export type MirrorIconVariant = (typeof MIRROR_ICON_VARIANTS)[number];

function svg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">${inner}</svg>`;
}

function mirrorIconSvg(variant: MirrorIconVariant): string {
  const a = C.accent;
  const m = C.muted;
  const t = C.text;
  switch (variant) {
    case 'flip':
      return svg(`
  <path d="M12 4v16" stroke="${m}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M16 8l3.5 4L16 16" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 8L4.5 12 8 16" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="5" y="6" width="5" height="12" rx="1" fill="${m}" fill-opacity="0.18"/>
  <rect x="14" y="6" width="5" height="12" rx="1" fill="${t}" fill-opacity="0.1"/>`);
    case 'external':
      return svg(`
  <path d="M14 3h7v7" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 14L21 3" stroke="${a}" stroke-width="2" stroke-linecap="round"/>
  <path d="M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="${m}" stroke-width="1.75" stroke-linecap="round"/>`);
    case 'sync':
      return svg(`
  <path d="M4 12a8 8 0 0 1 13.4-5.9" stroke="${a}" stroke-width="2" stroke-linecap="round"/>
  <path d="M20 7v5h-5" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 12a8 8 0 0 1-13.4 5.9" stroke="${m}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M4 17v-5h5" stroke="${m}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`);
    case 'split':
      return svg(`
  <rect x="3" y="5" width="8" height="14" rx="1.5" stroke="${m}" stroke-width="1.75"/>
  <rect x="13" y="5" width="8" height="14" rx="1.5" stroke="${a}" stroke-width="1.75"/>
  <path d="M12 9v6" stroke="${a}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>`);
    case 'arrow':
      return svg(`
  <path d="M5 12h12" stroke="${m}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M13 8l4 4-4 4" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="7" cy="12" r="2" fill="${a}" fill-opacity="0.35"/>`);
    default:
      return mirrorIconSvg('flip');
  }
}

export function resolveMirrorIconVariant(): MirrorIconVariant {
  try {
    const v = localStorage.getItem(ICON_STORAGE_KEY)?.trim();
    if (v && (MIRROR_ICON_VARIANTS as readonly string[]).includes(v)) {
      return v as MirrorIconVariant;
    }
  } catch {
    /* private mode */
  }
  return 'flip';
}

/** Dev/console: `localStorage.pamCtMirrorIcon = 'sync'; location.reload()` */
export function setMirrorIconVariant(variant: MirrorIconVariant): void {
  localStorage.setItem(ICON_STORAGE_KEY, variant);
}

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
  const variant = resolveMirrorIconVariant();
  icon.innerHTML = mirrorIconSvg(variant);
  icon.setAttribute('data-pam-icon', variant);
  label.textContent = MIRROR_BTN_LABEL;
  btn.title = btn.title || DEFAULT_TITLE;
}
