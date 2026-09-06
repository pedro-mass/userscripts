import { getPlatform } from '../platform/context';

interface LichessImportResponse {
  id: string;
  url: string;
}

export function importPgn(pgn: string): Promise<LichessImportResponse> {
  return getPlatform()
    .http.postForm('https://lichess.org/api/import', `pgn=${encodeURIComponent(pgn)}`, {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Lichess API returned ${response.status}`);
      }
      try {
        return JSON.parse(response.responseText) as LichessImportResponse;
      } catch {
        throw new Error('Failed to parse Lichess response');
      }
    });
}
