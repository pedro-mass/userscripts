import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lichess-position-notes/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Lichess: Study position notes',
        version: '0.1.1',
        author: 'pedro-mass',
        description:
          'Index your study comments by position (FEN) and show prior notes when you revisit the same board.',
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=lichess.org',
        namespace:
          'https://github.com/pedro-mass/userscripts/lichess-position-notes',
        match: [
          'https://lichess.org/study',
          'https://lichess.org/study/*',
          'https://lichess.org/study/*/*',
        ],
        license: 'GNU GPLv3',
        'run-at': 'document-idle',
        grant: 'none',
        updateURL: `${RAW_BASE}/lichess-position-notes.meta.js`,
        downloadURL: `${RAW_BASE}/lichess-position-notes.user.js`,
      },
      build: {
        fileName: 'lichess-position-notes.user.js',
        metaFileName: true,
      },
    }),
  ],
});
