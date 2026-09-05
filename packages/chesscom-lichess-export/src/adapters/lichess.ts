import { GM_xmlhttpRequest } from '$';

interface LichessImportResponse {
  id: string;
  url: string;
}

export function importPgn(pgn: string): Promise<LichessImportResponse> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://lichess.org/api/import',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      data: `pgn=${encodeURIComponent(pgn)}`,
      onload(response: { status: number; responseText: string }) {
        if (response.status !== 200) {
          reject(new Error(`Lichess API returned ${response.status}`));
          return;
        }
        try {
          resolve(JSON.parse(response.responseText) as LichessImportResponse);
        } catch {
          reject(new Error('Failed to parse Lichess response'));
        }
      },
      onerror() {
        reject(new Error('Network error contacting Lichess'));
      },
    });
  });
}
