import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/udemy-section-time/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Udemy - show section time',
        version: '1.4.0',
        author: 'pedro-mass',
        description:
          'For Udemy, displays the time a section has ( remaining time / total time).',
        namespace:
          'https://github.com/pedro-mass/userscripts/udemy-section-time',
        match: ['https://*.udemy.com/*', 'http://*.udemy.com/*'],
        'run-at': 'document-idle',
        grant: 'none',
        updateURL: `${RAW_BASE}/udemy-section-time.meta.js`,
        downloadURL: `${RAW_BASE}/udemy-section-time.user.js`,
      },
      build: {
        fileName: 'udemy-section-time.user.js',
        metaFileName: true,
      },
    }),
  ],
});
