import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/live-chart-filter/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'LiveChart.me Minimum Rating Filter with Themed UI (Persistent)',
        version: '1.8.0',
        author: 'pedro-mass',
        copyright: '2025, Pedro Mass (https://github.com/pedro-mass)',
        description:
          'Adds a minimum rating filter to anime list on LiveChart.me with styled UI and persistent value',
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=livechart.me',
        namespace: 'https://github.com/pedro-mass/userscripts/live-chart-filter',
        match: ['https://www.livechart.me/*'],
        license: 'GNU GPLv3',
        'run-at': 'document-idle',
        grant: 'none',
        updateURL: `${RAW_BASE}/live-chart-filter.meta.js`,
        downloadURL: `${RAW_BASE}/live-chart-filter.user.js`,
      },
      build: {
        fileName: 'live-chart-filter.user.js',
        metaFileName: true,
      },
    }),
  ],
});
