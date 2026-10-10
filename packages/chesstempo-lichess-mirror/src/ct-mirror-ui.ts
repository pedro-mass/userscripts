export const MIRROR_BTN_ID = 'pam-ct-open-lichess';
export const MIRROR_BTN_LABEL = 'mirror in lichess';
const STYLE_ID = 'pam-ct-mirror-btn-style';

/** Lichess-adjacent greens (screenshot-friendly, not official brand assets). */
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="3" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.9)"/>
  <rect x="13" y="13" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.55)"/>
  <path d="M11 7h2v3.5l2.2 2.2-1.4 1.4L11 11V7z" fill="#3d6b18"/>
  <path d="M13 17h-2v-3.5l-2.2-2.2 1.4-1.4L13 13v4z" fill="rgba(255,255,255,0.85)"/>
</svg>`;

export function ensureMirrorButtonStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
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
      border: 1px solid rgba(255, 255, 255, 0.28);
      background: linear-gradient(165deg, #7cb342 0%, #629924 42%, #4a7a1a 100%);
      color: #fff;
      font: 600 13px/1.2 system-ui, -apple-system, Segoe UI, sans-serif;
      letter-spacing: 0.02em;
      text-transform: lowercase;
      white-space: nowrap;
      box-shadow:
        0 4px 16px rgba(74, 122, 26, 0.45),
        0 1px 2px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.22);
      transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
    }
    #${MIRROR_BTN_ID}:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
      box-shadow:
        0 6px 20px rgba(74, 122, 26, 0.55),
        0 2px 4px rgba(0, 0, 0, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.28);
    }
    #${MIRROR_BTN_ID}:active {
      transform: translateY(0);
      filter: brightness(0.98);
    }
    #${MIRROR_BTN_ID}:focus-visible {
      outline: 2px solid #c5e99b;
      outline-offset: 3px;
    }
    #${MIRROR_BTN_ID} .pam-ct-mirror-icon {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
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
  if (!btn.querySelector('.pam-ct-mirror-icon')) {
    btn.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'pam-ct-mirror-icon';
    icon.innerHTML = ICON_SVG;
    const label = document.createElement('span');
    label.className = 'pam-ct-mirror-label';
    label.textContent = MIRROR_BTN_LABEL;
    btn.append(icon, label);
  } else {
    const label = btn.querySelector('.pam-ct-mirror-label');
    if (label) label.textContent = MIRROR_BTN_LABEL;
  }
  if (!btn.title) {
    btn.title =
      'Open Lichess analysis at this position and mirror further moves from ChessTempo';
  }
}
