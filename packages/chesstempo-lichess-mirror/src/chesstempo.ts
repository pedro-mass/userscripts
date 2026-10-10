import {
  fenDiagnostics,
  readBottomColorFromBoard,
  readCurrentCtFen,
} from './ct-fen';
import { startChessBoardPoll } from './ct-board-poll';
import {
  MIRROR_BTN_ID,
  applyMirrorButtonChrome,
  setMirrorButtonState,
  type MirrorUiState,
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
  clearTargetId,
  getTargetId,
  isMirrorTabLive,
  publishFromCt,
  setTargetId,
} from './sync';

let lastFen: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSince = 0;
const PENDING_GIVE_UP_MS = 20_000;

function mirrorButton(): HTMLButtonElement | null {
  return document.getElementById(MIRROR_BTN_ID) as HTMLButtonElement | null;
}

function resolveMirrorUiState(): MirrorUiState {
  const targetId = getTargetId();
  if (!targetId) return 'idle';
  if (isMirrorTabLive(targetId)) return 'live';
  return 'pending';
}

function refreshMirrorUiState(): void {
  const btn = mirrorButton();
  if (!btn) return;
  const targetId = getTargetId();
  const state = resolveMirrorUiState();

  if (!targetId) {
    pendingSince = 0;
    setMirrorButtonState(btn, 'idle');
    return;
  }

  if (state === 'live') {
    pendingSince = 0;
    setMirrorButtonState(btn, 'live');
    return;
  }

  if (!pendingSince) pendingSince = Date.now();
  if (Date.now() - pendingSince > PENDING_GIVE_UP_MS) {
    mirrorLog('info', 'mirror session cleared (lichess tab gone)');
    clearTargetId();
    pendingSince = 0;
    setMirrorButtonState(btn, 'idle');
    return;
  }

  setMirrorButtonState(btn, 'pending');
}

function onMirrorTabGone(): void {
  clearTargetId();
  pendingSince = 0;
  refreshMirrorUiState();
}

function wireTabClosed(tab: GmOpenTab | undefined): void {
  if (!tab) return;
  tab.onclosed = () => {
    mirrorLog('info', 'lichess tab closed (onclosed)');
    onMirrorTabGone();
  };
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
        setMirrorButtonState(btn!, 'idle');
        btn!.title = 'No position — reload training or check console [ct-mirror]';
        mirrorLog('warn', 'no FEN', diag);
        return;
      }
      const pairId = crypto.randomUUID();
      const bottomColor = readBottomColorFromBoard();
      setTargetId(pairId);
      pendingSince = Date.now();
      lastFen = fen;
      publishFromCt(fen, null, pairId, bottomColor);
      const tab = GM_openInTab(analysisBoardUrl(fen, pairId, bottomColor), {
        active: true,
      }) as GmOpenTab | undefined;
      wireTabClosed(tab);
      setMirrorButtonState(btn!, 'pending');
      mirrorLog('info', 'opened tab', { pairId, fen });
      writeDomProbe({ lastFen: fen });
    });
    wrap.insertBefore(btn, wrap.firstChild);
  }

  applyMirrorButtonChrome(btn, resolveMirrorUiState());
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
    refreshMirrorUiState();
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

  setInterval(() => {
    writeDomProbe({ lastFen });
    refreshMirrorUiState();
  }, 2000);
}
