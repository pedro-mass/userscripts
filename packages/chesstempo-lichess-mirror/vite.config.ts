import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/chesstempo-lichess-mirror/dist';

export default defineConfig({
  define: {
    __CT_MIRROR_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'ChessTempo → Lichess mirror',
        version: pkg.version,
        author: 'pedro-mass',
        description:
          'Combine ChessTempo transposition-aware opening training with Lichess database and free engine via a live mirrored analysis tab.',
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
          'GM_info',
          'GM_setValue',
          'GM_getValue',
          'GM_addValueChangeListener',
          'GM_addElement',
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
