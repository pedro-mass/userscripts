import {
  fenDiagnostics,
  readBottomColorFromBoard,
  readCurrentCtFen,
} from './ct-fen';
import { hookOpeningExplorerSetPosition } from './ct-page-hook';
import { analysisBoardUrl } from './fen';
import { isDebugEnabled, mirrorLog } from './log';
import { writeDomProbe } from './probe';
import {
  getTargetId,
  publishFromCt,
  setTargetId,
} from './sync';

const BTN_ID = 'pam-ct-open-lichess';
const STATUS_ID = 'pam-ct-mirror-status';

let lastFen: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onFenChange(fen: string): void {
  const prev = lastFen;
  lastFen = fen;
  const targetId = getTargetId();
  if (!targetId) return;

  updateStatus(`Mirror → Lichess (${targetId.slice(0, 8)}…)`);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    mirrorLog('debug', 'publish', { fen, prev, targetId });
    publishFromCt(fen, prev, targetId, readBottomColorFromBoard());
    writeDomProbe({ lastFen: fen });
  }, 120);
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
  updateStatus(isDebugEnabled() ? 'debug on (console)' : '');

  btn.addEventListener('click', () => {
    const fen = readCurrentCtFen(lastFen);
    const diag = fenDiagnostics();
    mirrorLog('info', 'Open in Lichess click', { fen, ...diag });
    if (!fen) {
      updateStatus('No position — see console [ct-mirror]');
      mirrorLog('warn', 'no FEN', diag);
      return;
    }
    const pairId = crypto.randomUUID();
    const bottomColor = readBottomColorFromBoard();
    setTargetId(pairId);
    lastFen = fen;
    publishFromCt(fen, null, pairId, bottomColor);
    GM_openInTab(analysisBoardUrl(fen, pairId, bottomColor), { active: true });
    updateStatus(`Opened · mirror ${pairId.slice(0, 8)}…`);
    mirrorLog('info', 'opened tab', { pairId, fen });
    writeDomProbe({ lastFen: fen });
  });

  wrap.append(btn, status);
  panel.prepend(wrap);
}

function updateStatus(text: string): void {
  const el = document.getElementById(STATUS_ID);
  if (el) el.textContent = text;
}

export function startChesstempoMirror(): void {
  mirrorLog('info', 'CT mirror start', {
    injectInto: 'page',
    debug: isDebugEnabled(),
  });
  writeDomProbe({ lastFen: null });

  hookOpeningExplorerSetPosition(onFenChange);

  const uiInterval = setInterval(() => {
    injectUi();
    const fen = readCurrentCtFen(lastFen);
    if (fen && !lastFen) {
      lastFen = fen;
      mirrorLog('debug', 'seed FEN from board', { fen });
    }
    if (document.getElementById(BTN_ID)) clearInterval(uiInterval);
  }, 500);
  setTimeout(() => clearInterval(uiInterval), 120_000);

  setInterval(() => writeDomProbe({ lastFen }), 2000);
}
