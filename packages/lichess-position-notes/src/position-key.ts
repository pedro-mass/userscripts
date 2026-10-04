/** EPD: FEN fields 1–4 (transposition key). */
export function positionKeyFromFen(fen: string): string {
  return fen.trim().split(/\s+/).slice(0, 4).join(' ');
}
