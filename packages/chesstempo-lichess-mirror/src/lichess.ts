import {
  analysisBoardUrl,
  encodeFenForAnalysisUrl,
  parsePamMirrorParam,
  parsePamOrientParam,
  singleMoveUci,
} from './fen';
import bridgeSource from './lichess-page-bridge.source.js?raw';
import { mirrorLog } from './log';
import { ensureProbeHost, writeDomProbe } from './probe';
import type { BottomColor, MirrorPayload } from './types';
import {
  getLatestPayload,
  getMirrorSessionId,
  getTargetId,
  initLastAppliedSeqFromStorage,
  markPayloadApplied,
  onMirrorPayload,
  setMirrorSessionId,
  setTargetId,
  shouldApply,
} from './sync';

type ApplyResult = 'at_target' | 'played' | 'navigating' | 'failed';

function installPageBridge(): void {
  if (document.getElementById('pam-ct-page-bridge-installed')) return;
  const marker = document.createElement('div');
  marker.id = 'pam-ct-page-bridge-installed';
  marker.hidden = true;
  document.documentElement.append(marker);
  GM_addElement('script', {
    id: 'pam-ct-page-bridge',
    textContent: bridgeSource,
  });
}

function waitForPageBridge(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      document.removeEventListener('pam-ct-bridge-ready', done);
      resolve();
    };
    document.addEventListener('pam-ct-bridge-ready', done);
    installPageBridge();
    setTimeout(() => {
      document.removeEventListener('pam-ct-bridge-ready', done);
      resolve();
    }, 60_000);
  });
}

function applyViaPageBridge(
  fen: string,
  prevFen: string | null,
  bottomColor?: BottomColor,
): Promise<ApplyResult> {
  const pairId = getMirrorSessionId() || parsePamMirrorParam();
  const orient = bottomColor ?? parsePamOrientParam() ?? 'white';
  const navigateUrl = pairId
    ? analysisBoardUrl(fen, pairId, orient)
    : `https://lichess.org/analysis/standard/${encodeFenForAnalysisUrl(fen)}`;
  const uciMove =
    prevFen && prevFen !== fen ? singleMoveUci(prevFen, fen) : null;

  const id = crypto.randomUUID();
  return new Promise((resolve) => {
    const onResult = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id: string; result: ApplyResult }>)
        .detail;
      if (!detail || detail.id !== id) return;
      document.removeEventListener('pam-ct-apply-result', onResult);
      resolve(detail.result ?? 'failed');
    };
    document.addEventListener('pam-ct-apply-result', onResult);
    document.dispatchEvent(
      new CustomEvent('pam-ct-apply-position', {
        detail: {
          id,
          fen,
          uci: uciMove,
          navigateUrl,
          bottomColor: orient,
        },
      }),
    );
    setTimeout(() => {
      document.removeEventListener('pam-ct-apply-result', onResult);
      resolve('failed');
    }, 12_000);
  });
}

let drainInFlight = false;
let pendingPayload: MirrorPayload | null = null;
let analysisReady = false;

async function drainPayload(payload: MirrorPayload): Promise<void> {
  if (!analysisReady) return;
  if (!shouldApply(payload)) return;
  if (drainInFlight) {
    if (!pendingPayload || payload.seq > pendingPayload.seq) {
      pendingPayload = payload;
    }
    return;
  }
  drainInFlight = true;
  try {
    if (!getMirrorSessionId()) setMirrorSessionId(payload.targetId);
    mirrorLog('info', 'apply position', {
      seq: payload.seq,
      fen: payload.fen,
      prevFen: payload.prevFen,
    });
    writeDomProbe({ lastFen: payload.fen, seq: payload.seq });
    const result = await applyViaPageBridge(
      payload.fen,
      payload.prevFen,
      payload.bottomColor,
    );
    if (result === 'navigating') {
      markPayloadApplied(payload.seq, payload.targetId);
      mirrorLog('info', 'marked applied (navigating)', { seq: payload.seq });
      return;
    }
    if (result === 'at_target' || result === 'played') {
      markPayloadApplied(payload.seq, payload.targetId);
      mirrorLog('info', 'marked applied', { seq: payload.seq, result });
    } else {
      mirrorLog('warn', 'position not at target after apply', {
        seq: payload.seq,
        want: payload.fen,
        result,
      });
    }
  } catch (e) {
    mirrorLog('warn', 'drain failed', { seq: payload.seq, err: String(e) });
  } finally {
    drainInFlight = false;
    const next = pendingPayload;
    pendingPayload = null;
    if (next && shouldApply(next)) void drainPayload(next);
  }
}

export function startLichessMirror(): void {
  const mountProbe = () => ensureProbeHost();
  if (document.body) mountProbe();
  else document.addEventListener('DOMContentLoaded', mountProbe, { once: true });

  const fromUrl = parsePamMirrorParam();
  if (fromUrl) {
    setMirrorSessionId(fromUrl);
    setTargetId(fromUrl);
  }
  initLastAppliedSeqFromStorage();

  void waitForPageBridge().then(() => {
    analysisReady = true;
    window.__pamCtAnalysisReady = true;
    mirrorLog('info', 'Lichess mirror listening (page bridge)', {
      pamMirror: fromUrl,
      session: getMirrorSessionId(),
      targetId: getTargetId(),
    });
    const latest = getLatestPayload();
    if (latest) void drainPayload(latest);
    setInterval(() => {
      const p = getLatestPayload();
      if (p) void drainPayload(p);
    }, 400);
  });

  setInterval(() => writeDomProbe({}), 2000);

  onMirrorPayload((payload) => {
    mirrorLog('debug', 'payload event', { seq: payload.seq });
    void drainPayload(payload);
  });
}
