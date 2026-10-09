import { analysisBoardUrl } from './fen';
import {
  getTargetId,
  publishFromCt,
  setTargetId,
} from './sync';

const BTN_ID = 'pam-ct-open-lichess';
const STATUS_ID = 'pam-ct-mirror-status';

let lastFen: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function readFenFromExplorer(): string | null {
  if (lastFen) return lastFen;
  const explorer = document.querySelector('opening-explorer');
  const fromData = explorer?.getAttribute('data-pam-mirror-fen');
  if (fromData) return fromData;
  const el = explorer as (HTMLElement & { fen?: string }) | null;
  if (el?.fen) return el.fen;
  return null;
}

function onFenChange(fen: string): void {
  const prev = lastFen;
  lastFen = fen;
  const targetId = getTargetId();
  if (!targetId) return;

  updateStatus(`Mirror → Lichess (${targetId.slice(0, 8)}…)`);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    publishFromCt(fen, prev, targetId);
  }, 120);
}

function hookOpeningExplorer(): void {
  const tryHook = (): boolean => {
    const explorer = document.querySelector('opening-explorer') as
      | (HTMLElement & {
          setPosition?: (fen: string) => void;
          fen?: string;
        })
      | null;
    if (!explorer?.setPosition || explorer.dataset.pamMirrorHook === '1') {
      return explorer?.dataset.pamMirrorHook === '1';
    }

    explorer.dataset.pamMirrorHook = '1';
    const orig = explorer.setPosition.bind(explorer);
    explorer.setPosition = (fen: string) => {
      orig(fen);
      explorer.setAttribute('data-pam-mirror-fen', fen);
      onFenChange(fen);
    };

    if (explorer.fen) onFenChange(explorer.fen);
    return true;
  };

  if (tryHook()) return;

  customElements.whenDefined('opening-explorer').then(() => {
    tryHook();
  });

  const obs = new MutationObserver(() => tryHook());
  obs.observe(document.body, { childList: true, subtree: true });
}

function injectUi(): void {
  if (document.getElementById(BTN_ID)) return;

  const panel =
    document.querySelector('.ct-ot-right-panel') ||
    document.querySelector('opening-training-ui');
  if (!panel) return;

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display:flex;gap:8px;align-items:center;padding:6px 8px;flex-wrap:wrap;';

  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.textContent = 'Open in Lichess';
  btn.title =
    'Open Lichess analysis at this position and mirror further moves from ChessTempo';
  btn.style.cssText =
    'cursor:pointer;padding:6px 12px;border-radius:4px;border:1px solid #888;background:#2d5016;color:#fff;font-size:13px;';

  const status = document.createElement('span');
  status.id = STATUS_ID;
  status.style.cssText = 'font-size:12px;color:#666;';
  updateStatus('');

  btn.addEventListener('click', () => {
    const fen = readFenFromExplorer();
    if (!fen) {
      updateStatus('No position — open the repertoire editor first.');
      return;
    }
    const pairId = crypto.randomUUID();
    setTargetId(pairId);
    lastFen = fen;
    publishFromCt(fen, null, pairId);
    GM_openInTab(analysisBoardUrl(fen, pairId), { active: true });
    updateStatus(`Opened · mirror ${pairId.slice(0, 8)}…`);
  });

  wrap.append(btn, status);
  panel.prepend(wrap);
}

function updateStatus(text: string): void {
  const el = document.getElementById(STATUS_ID);
  if (el) el.textContent = text;
}

export function startChesstempoMirror(): void {
  hookOpeningExplorer();
  const uiInterval = setInterval(() => {
    injectUi();
    if (document.getElementById(BTN_ID)) clearInterval(uiInterval);
  }, 500);
  setTimeout(() => clearInterval(uiInterval), 120_000);
}
