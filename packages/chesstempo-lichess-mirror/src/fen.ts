import { Chess } from 'chessops/chess';
import type { Move } from 'chessops/types';
import { parseFen, makeFen } from 'chessops/fen';
import { makeUci } from 'chessops/util';

function legalMoves(chess: Chess): Move[] {
  const out: Move[] = [];
  for (const [from, dests] of chess.allDests()) {
    for (const to of dests) {
      out.push({ from, to });
    }
  }
  return out;
}

/** Position key: pieces + side + castling + en passant (ignore clocks). */
export function positionKey(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  return parts.slice(0, 4).join(' ');
}

export function encodeFenForAnalysisUrl(fen: string): string {
  return encodeURIComponent(fen.trim())
    .replace(/%20/g, '_')
    .replace(/%2F/g, '/');
}

export function analysisBoardUrl(
  fen: string,
  pairId: string,
  bottomColor: 'white' | 'black' = 'white',
): string {
  const pathFen = encodeFenForAnalysisUrl(fen);
  const q = new URLSearchParams({
    pamMirror: pairId,
    pamOrient: bottomColor,
  });
  return `https://lichess.org/analysis/standard/${pathFen}?${q.toString()}`;
}

export function parsePamOrientParam(): 'white' | 'black' | null {
  const v = new URLSearchParams(location.search).get('pamOrient');
  return v === 'white' || v === 'black' ? v : null;
}

export function parsePamMirrorParam(): string | null {
  const q = new URLSearchParams(location.search).get('pamMirror');
  return q?.trim() || null;
}

/** If exactly one legal move connects two positions, return its UCI. */
export function singleMoveUci(fromFen: string, toFen: string): string | null {
  if (positionKey(fromFen) === positionKey(toFen)) return null;

  const from = parseFen(fromFen);
  const to = parseFen(toFen);
  if (!from.isOk || !to.isOk) return null;

  const pos = Chess.fromSetup(from.value);
  if (!pos.isOk) return null;
  const chess = pos.value;
  const targetKey = positionKey(toFen);

  for (const move of legalMoves(chess)) {
    const next = chess.clone();
    next.play(move);
    const nextFen = makeFen(next.toSetup());
    if (positionKey(nextFen) === targetKey) return makeUci(move);
  }
  return null;
}
