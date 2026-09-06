import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(root, 'dist/extension');

function extensionAssetsPlugin(): Plugin {
  return {
    name: 'extension-assets',
    closeBundle() {
      mkdirSync(resolve(outDir, 'images'), { recursive: true });
      cpSync(
        resolve(root, 'extension/manifest.json'),
        resolve(outDir, 'manifest.json'),
      );
      cpSync(
        resolve(root, 'store/images/icon-48.png'),
        resolve(outDir, 'images/icon-48.png'),
      );
      cpSync(
        resolve(root, 'store/images/icon-128.png'),
        resolve(outDir, 'images/icon-128.png'),
      );

      const stamp = String(Date.now());
      writeFileSync(
        resolve(outDir, 'build-meta.json'),
        JSON.stringify({ stamp, appChunk: 'app.js' }, null, 2),
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  root,
  define: {
    'import.meta.env.DEV': mode === 'development' ? 'true' : 'false',
  },
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        'content-script': resolve(root, 'extension/content-script.ts'),
        app: resolve(root, 'src/app.ts'),
        'service-worker': resolve(root, 'extension/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'app') return 'app.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [extensionAssetsPlugin()],
}));
