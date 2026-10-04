import { parseComment } from 'chessops/pgn';

/** Human-readable text from a Lichess PGN comment token (may omit outer braces). */
export function humanTextFromPgnComment(raw: string): string {
  const wrapped = raw.trim().startsWith('{') ? raw : `{${raw}}`;
  let text = parseComment(wrapped).text.trim();
  text = text.replace(/^\{\s*|\s*\}$/g, '').trim();
  text = text.replace(/\[%[^\]]*\]/g, '').trim();
  return text;
}
