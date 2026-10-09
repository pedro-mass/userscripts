import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesstempo-lichess-mirror/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'ChessTempo → Lichess mirror',
        version: '0.1.5',
        author: 'pedro-mass',
        description:
          'Mirror ChessTempo opening-training position to a Lichess analysis tab (Open in Lichess + live FEN sync).',
        icon: 'https://lichess.org/favicon.ico',
        namespace:
          'https://github.com/pedro-mass/userscripts/chesstempo-lichess-mirror',
        homepageURL:
          'https://github.com/pedro-mass/userscripts/tree/main/packages/chesstempo-lichess-mirror',
        supportURL:
          'https://github.com/pedro-mass/userscripts/issues',
        match: [
          'https://chesstempo.com/opening-training/*',
          'https://www.chesstempo.com/opening-training/*',
          'https://lichess.org/analysis*',
        ],
        license: 'GPL-3.0-only',
        'run-at': 'document-idle',
        'inject-into': 'page',
        grant: [
          'GM_setValue',
          'GM_getValue',
          'GM_addValueChangeListener',
          'GM_openInTab',
        ],
        updateURL: `${RAW_BASE}/chesstempo-lichess-mirror.meta.js`,
        downloadURL: `${RAW_BASE}/chesstempo-lichess-mirror.user.js`,
      },
      build: {
        fileName: 'chesstempo-lichess-mirror.user.js',
        metaFileName: true,
      },
    }),
  ],
});
