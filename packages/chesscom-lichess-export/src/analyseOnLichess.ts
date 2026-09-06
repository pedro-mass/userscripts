import { importPgn } from './adapters/lichess';
import { getPlatform } from './platform/context';
import { resolvePgn } from './adapters/pgn';
import { extractGameId, getStoredLichessUrl, saveLichessUrl } from './storage';

export async function analyseOnLichess(): Promise<void> {
  const gameId = extractGameId();

  if (gameId) {
    const cachedUrl = getStoredLichessUrl(gameId);
    if (cachedUrl) {
      getPlatform().tabs.open(cachedUrl, true);
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

  getPlatform().tabs.open(result.url, true);
}
