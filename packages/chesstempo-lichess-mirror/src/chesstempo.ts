import {
  fenDiagnostics,
  readBottomColorFromBoard,
  readCurrentCtFen,
} from './ct-fen';
import { startChessBoardPoll } from './ct-board-poll';
import {
  MIRROR_BTN_ID,
  applyMirrorButtonChrome,
} from './ct-mirror-ui';
import { hookOpeningExplorerSetPosition } from './ct-page-hook';
import { analysisBoardUrl, pieceSideKey } from './fen';
import { isDebugEnabled, mirrorLog } from './log';
import {
  PROBE_WRAP_ID,
  ensureProbeHost,
  removeLegacyProbeNodes,
  writeDomProbe,
} from './probe';
import {
  getTargetId,
  publishFromCt,
  setTargetId,
} from './sync';

let lastFen: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function mirrorButton(): HTMLButtonElement | null {
  return document.getElementById(MIRROR_BTN_ID) as HTMLButtonElement | null;
}

function setButtonTitle(text: string): void {
  const btn = mirrorButton();
  if (btn) btn.title = text;
}

function onFenChange(fen: string): void {
  if (lastFen && pieceSideKey(lastFen) === pieceSideKey(fen)) return;
  const prev = lastFen;
  lastFen = fen;
  const targetId = getTargetId();
  if (!targetId) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    mirrorLog('debug', 'publish', { fen, prev, targetId });
    publishFromCt(fen, prev, targetId, readBottomColorFromBoard());
    writeDomProbe({ lastFen: fen });
  }, 120);
}

function injectUi(): void {
  if (!document.body) return;

  ensureProbeHost();
  const wrap = document.getElementById(PROBE_WRAP_ID);
  if (!wrap) return;

  document.getElementById('pam-ct-mirror-status')?.remove();
  wrap.querySelector('[data-pam-ct-ui-row]')?.remove();

  let btn = mirrorButton();
  if (!btn) {
    btn = document.createElement('button');
    btn.id = MIRROR_BTN_ID;
    btn.addEventListener('click', () => {
      const fen = readCurrentCtFen(lastFen);
      const diag = fenDiagnostics();
      mirrorLog('info', 'mirror in lichess click', { fen, ...diag });
      if (!fen) {
        setButtonTitle('No position — reload training or check console [ct-mirror]');
        mirrorLog('warn', 'no FEN', diag);
        return;
      }
      const pairId = crypto.randomUUID();
      const bottomColor = readBottomColorFromBoard();
      setTargetId(pairId);
      lastFen = fen;
      publishFromCt(fen, null, pairId, bottomColor);
      GM_openInTab(analysisBoardUrl(fen, pairId, bottomColor), { active: true });
      setButtonTitle('Mirroring — play moves on ChessTempo');
      mirrorLog('info', 'opened tab', { pairId, fen });
      writeDomProbe({ lastFen: fen });
    });
    wrap.insertBefore(btn, wrap.firstChild);
  }

  applyMirrorButtonChrome(btn);
  if (isDebugEnabled()) {
    btn.title = 'Debug on — see console [ct-mirror]';
  }
  writeDomProbe({ lastFen });
}

export function startChesstempoMirror(): void {
  removeLegacyProbeNodes();
  mirrorLog('info', 'CT mirror start', {
    injectInto: 'page',
    debug: isDebugEnabled(),
  });
  hookOpeningExplorerSetPosition(onFenChange);
  startChessBoardPoll(onFenChange);

  const mount = () => {
    injectUi();
    const fen = readCurrentCtFen(lastFen);
    if (fen && !lastFen) {
      lastFen = fen;
      mirrorLog('debug', 'seed FEN from board', { fen });
    }
  };

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });

  const uiInterval = setInterval(() => {
    mount();
    if (mirrorButton()) clearInterval(uiInterval);
  }, 500);
  setTimeout(() => clearInterval(uiInterval), 120_000);

  setInterval(() => writeDomProbe({ lastFen }), 2000);
}
