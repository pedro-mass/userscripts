import {
  analysisBoardUrl,
  encodeFenForAnalysisUrl,
  parsePamMirrorParam,
  parsePamOrientParam,
  pieceSideKey,
  singleMoveUci,
} from './fen';
import { mirrorLog } from './log';
import { writeDomProbe } from './probe';
import type { BottomColor, MirrorPayload } from './types';
import {
  getLatestPayload,
  getMirrorSessionId,
  getTargetId,
  markPayloadApplied,
  onMirrorPayload,
  setMirrorSessionId,
  setTargetId,
  shouldApply,
} from './sync';

function waitForLichessAnalysis(): Promise<void> {
  if (window.lichess?.analysis?.playUci) return Promise.resolve();
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (window.lichess?.analysis?.playUci) {
        resolve();
        return;
      }
      if (Date.now() - start > 60_000) {
        mirrorLog('warn', 'Lichess analysis API not found');
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    window.site?.load?.then(() => requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });
}

function currentFen(): string | null {
  const fromNode = window.site?.analysis?.node?.fen;
  if (fromNode) return fromNode;
  const ground = window.lichess?.chessground?.();
  if (ground) {
    const pieceFen = ground.getFen();
    return pieceFen;
  }
  return null;
}

function applyBoardOrientation(bottomColor: BottomColor): void {
  const ground = window.lichess?.chessground?.();
  if (!ground) return;
  if (ground.state.orientation !== bottomColor) {
    ground.set({ orientation: bottomColor });
    mirrorLog('debug', 'board orientation', { bottomColor });
  }
}

function navigateToFen(fen: string, bottomColor?: BottomColor): void {
  const pairId = getMirrorSessionId() || parsePamMirrorParam();
  const pathFen = encodeFenForAnalysisUrl(fen);
  const url = pairId
    ? analysisBoardUrl(fen, pairId, bottomColor ?? parsePamOrientParam() ?? 'white')
    : `https://lichess.org/analysis/standard/${pathFen}`;
  if (location.href !== url) window.location.assign(url);
}

function atTargetPosition(here: string, targetFen: string): boolean {
  return pieceSideKey(here) === pieceSideKey(targetFen);
}

async function applyPosition(
  fen: string,
  prevFen: string | null,
  bottomColor?: BottomColor,
): Promise<boolean> {
  await waitForLichessAnalysis();
  if (bottomColor) applyBoardOrientation(bottomColor);
  const playUci = window.lichess?.analysis?.playUci;
  if (!playUci) {
    navigateToFen(fen, bottomColor);
    return true;
  }

  const here = currentFen();
  if (here && atTargetPosition(here, fen)) return true;

  const tryPlay = (uci: string): boolean => {
    playUci(uci);
    const after = currentFen();
    return !!(after && atTargetPosition(after, fen));
  };

  if (prevFen && here && pieceSideKey(here) === pieceSideKey(prevFen)) {
    const uci = singleMoveUci(prevFen, fen);
    if (uci && tryPlay(uci)) return true;
  }

  if (here && !atTargetPosition(here, fen)) {
    const uci = singleMoveUci(here, fen);
    if (uci && tryPlay(uci)) return true;
  }

  mirrorLog('info', 'navigate to FEN', { fen });
  navigateToFen(fen, bottomColor);
  return true;
}

let drainInFlight = false;

async function drainPayload(payload: MirrorPayload): Promise<void> {
  if (!shouldApply(payload)) return;
  if (drainInFlight) return;
  drainInFlight = true;
  try {
    if (!getMirrorSessionId()) setMirrorSessionId(payload.targetId);
    mirrorLog('info', 'apply position', {
      seq: payload.seq,
      fen: payload.fen,
      prevFen: payload.prevFen,
    });
    writeDomProbe({ lastFen: payload.fen, seq: payload.seq });
    await applyPosition(payload.fen, payload.prevFen, payload.bottomColor);
    markPayloadApplied(payload.seq);
  } finally {
    drainInFlight = false;
  }
}

export function startLichessMirror(): void {
  const fromUrl = parsePamMirrorParam();
  if (fromUrl) {
    setMirrorSessionId(fromUrl);
    setTargetId(fromUrl);
  }

  void waitForLichessAnalysis().then(() => {
    const orient = parsePamOrientParam();
    if (orient) applyBoardOrientation(orient);
    mirrorLog('info', 'Lichess mirror listening', {
      pamMirror: fromUrl,
      pamOrient: orient,
      session: getMirrorSessionId(),
      targetId: getTargetId(),
      cgOrientation: window.lichess?.chessground?.().state.orientation,
    });
    const latest = getLatestPayload();
    if (latest) void drainPayload(latest);
  });

  setInterval(() => writeDomProbe({}), 2000);

  onMirrorPayload((payload) => {
    mirrorLog('debug', 'payload event', { seq: payload.seq });
    void drainPayload(payload);
  });

  setInterval(() => {
    const latest = getLatestPayload();
    if (latest) void drainPayload(latest);
  }, 400);
}
