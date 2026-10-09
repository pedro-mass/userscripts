import {
  analysisBoardUrl,
  encodeFenForAnalysisUrl,
  parsePamMirrorParam,
  positionKey,
  singleMoveUci,
} from './fen';
import type { MirrorPayload } from './types';
import {
  getMirrorSessionId,
  onMirrorPayload,
  setMirrorSessionId,
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
        console.warn('[ct-mirror] Lichess analysis API not found');
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

function navigateToFen(fen: string): void {
  const pairId = getMirrorSessionId() || parsePamMirrorParam();
  const pathFen = encodeFenForAnalysisUrl(fen);
  const url = pairId
    ? analysisBoardUrl(fen, pairId)
    : `https://lichess.org/analysis/standard/${pathFen}`;
  if (location.href !== url) window.location.assign(url);
}

async function applyPosition(fen: string, prevFen: string | null): Promise<void> {
  await waitForLichessAnalysis();
  const playUci = window.lichess?.analysis?.playUci;
  if (!playUci) {
    navigateToFen(fen);
    return;
  }

  const here = currentFen();
  if (here && positionKey(here) === positionKey(fen)) return;

  if (prevFen && here && positionKey(here) === positionKey(prevFen)) {
    const uci = singleMoveUci(prevFen, fen);
    if (uci) {
      playUci(uci);
      return;
    }
  }

  if (here && positionKey(here) !== positionKey(fen)) {
    const uci = singleMoveUci(here, fen);
    if (uci) {
      playUci(uci);
      return;
    }
  }

  navigateToFen(fen);
}

export function startLichessMirror(): void {
  const fromUrl = parsePamMirrorParam();
  if (fromUrl) setMirrorSessionId(fromUrl);

  const sessionId = getMirrorSessionId();
  if (!sessionId) return;

  void waitForLichessAnalysis().then(() => {
    console.info('[ct-mirror] Lichess mirror target', sessionId);
  });

  onMirrorPayload((payload: MirrorPayload) => {
    const myId = getMirrorSessionId();
    if (!myId || !shouldApply(payload, myId)) return;
    void applyPosition(payload.fen, payload.prevFen);
  });
}
