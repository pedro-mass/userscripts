import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lichess-stats/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Lichess: Training: Stats for Current Run',
        version: '1.2.0',
        author: 'pedro-mass',
        description: 'When doing puzzles, this will show you your stats',
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=lichess.org',
        namespace: 'https://github.com/pedro-mass/userscripts/lichess-stats',
        match: [
          'https://lichess.org/training/*',
          'https://lichess.org/training',
        ],
        license: 'GNU GPLv3',
        'run-at': 'document-idle',
        grant: 'none',
        updateURL: `${RAW_BASE}/lichess-stats.meta.js`,
        downloadURL: `${RAW_BASE}/lichess-stats.user.js`,
      },
      build: {
        fileName: 'lichess-stats.user.js',
        metaFileName: true,
      },
    }),
  ],
});
