import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/cursor-spend-pace/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Cursor Spending Pace',
        version: '0.1.1',
        author: 'pedro-mass',
        copyright: '2026, Pedro Mass (https://github.com/pedro-mass)',
        description:
          'Shows linear-burn pace markers on the Cursor spending dashboard so you can see if usage is ahead or behind the billing cycle',
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=cursor.com',
        namespace: 'https://github.com/pedro-mass/userscripts/cursor-spend-pace',
        match: ['https://cursor.com/*', 'https://www.cursor.com/*'],
        license: 'GNU GPLv3',
        'run-at': 'document-start',
        grant: 'none',
        updateURL: `${RAW_BASE}/cursor-spend-pace.meta.js`,
        downloadURL: `${RAW_BASE}/cursor-spend-pace.user.js`,
      },
      build: {
        fileName: 'cursor-spend-pace.user.js',
        metaFileName: true,
      },
    }),
  ],
});
