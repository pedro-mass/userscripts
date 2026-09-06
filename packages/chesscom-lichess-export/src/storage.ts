import { getPlatform } from './platform/context';

export const STORAGE_KEY = 'cc2l_game_map';

type GameMap = Record<string, string>;

/**
 * Game id from /game/live/123, /analysis/game/live/123/review, etc.
 */
export function extractGameId(
  pathname: string = window.location.pathname,
): string | null {
  const match = pathname.match(/\/(?:analysis\/)?game\/(?:[a-z-]+\/)?(\d+)/i);
  return match ? match[1] : null;
}

function getGameMap(): GameMap {
  try {
    const raw = getPlatform().storage.get(STORAGE_KEY, '{}');
    return JSON.parse(raw) as GameMap;
  } catch {
    return {};
  }
}

export function getStoredLichessUrl(gameId: string): string | null {
  return getGameMap()[gameId] ?? null;
}

export function saveLichessUrl(gameId: string, lichessUrl: string): void {
  const map = getGameMap();
  map[gameId] = lichessUrl;
  getPlatform().storage.set(STORAGE_KEY, JSON.stringify(map));
}
