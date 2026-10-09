import { readFenFromChessBoard } from './ct-fen';
import { pieceSideKey } from './fen';
import { mirrorLog } from './log';
import { getTargetId } from './sync';

/** Training moves update `chess-board`; explorer `setPosition` is not always called. */
export function startChessBoardPoll(onFen: (fen: string) => void): void {
  let lastSeen: string | null = null;

  setInterval(() => {
    if (!getTargetId()) return;
    const fen = readFenFromChessBoard();
    if (!fen) return;
    if (lastSeen && pieceSideKey(fen) === pieceSideKey(lastSeen)) return;
    lastSeen = fen;
    mirrorLog('debug', 'board poll fen change', { fen });
    onFen(fen);
  }, 250);
}
