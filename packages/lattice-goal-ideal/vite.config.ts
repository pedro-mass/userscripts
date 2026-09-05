import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const RAW_BASE =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages/lattice-goal-ideal/dist';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Lattice Goals - Add Ideal',
        version: '1.4',
        author: 'pedro-mass',
        description:
          'Determines ideal goal value based on Created on and Due dates',
        namespace:
          'https://github.com/pedro-mass/userscripts/lattice-goal-ideal',
        match: [
          'http://*.latticehq.com/goals/*',
          'https://*.latticehq.com/goals/*',
        ],
        'run-at': 'document-idle',
        grant: 'none',
        updateURL: `${RAW_BASE}/lattice-goal-ideal.meta.js`,
        downloadURL: `${RAW_BASE}/lattice-goal-ideal.user.js`,
      },
      build: {
        fileName: 'lattice-goal-ideal.user.js',
        metaFileName: true,
      },
    }),
  ],
});
