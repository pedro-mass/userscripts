import { GM_openInTab } from '$';
import { importPgn } from './adapters/lichess';
import { resolvePgn } from './adapters/pgn';
import { extractGameId, getStoredLichessUrl, saveLichessUrl } from './storage';

export async function analyseOnLichess(): Promise<void> {
  const gameId = extractGameId();

  if (gameId) {
    const cachedUrl = getStoredLichessUrl(gameId);
    if (cachedUrl) {
      GM_openInTab(cachedUrl, { active: true, insert: true });
      return;
    }
  }

  const pgn = await resolvePgn(gameId);
  if (!pgn.includes('[Termination')) {
    throw new Error('Game is not finished yet');
  }

  const result = await importPgn(pgn);

  if (gameId) {
    saveLichessUrl(gameId, result.url);
  }

  GM_openInTab(result.url, { active: true, insert: true });
}
