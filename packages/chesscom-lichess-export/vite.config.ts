import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesscom-lichess-export/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Chess.com → Lichess Export',
        version: '1.0.1',
        author: 'pedro-mass',
        description:
          'One-click PGN export from Chess.com to Lichess (game-over modal, sidebar, share dialog)',
        icon: 'https://lichess.org/favicon.ico',
        namespace:
          'https://github.com/pedro-mass/userscripts/chesscom-lichess-export',
        homepageURL:
          'https://github.com/pedro-mass/userscripts/tree/main/packages/chesscom-lichess-export',
        supportURL:
          'https://github.com/pedro-mass/userscripts/issues',
        match: ['https://www.chess.com/*', 'https://chess.com/*'],
        license: 'GPL-3.0-only',
        'run-at': 'document-idle',
        grant: ['GM_xmlhttpRequest', 'GM_getValue', 'GM_setValue', 'GM_openInTab'],
        connect: ['lichess.org'],
        updateURL: `${RAW_BASE}/chesscom-lichess-export.meta.js`,
        downloadURL: `${RAW_BASE}/chesscom-lichess-export.user.js`,
      },
      build: {
        fileName: 'chesscom-lichess-export.user.js',
        metaFileName: true,
      },
    }),
  ],
});
