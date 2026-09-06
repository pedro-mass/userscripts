import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist/extension');
const mode = process.env.VITE_EXTENSION_MODE ?? 'production';

function devDefine() {
  return {
    'import.meta.env.DEV': mode === 'development' ? 'true' : 'false',
  };
}

function extensionAssetsPlugin() {
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
      writeFileSync(
        resolve(outDir, 'build-meta.json'),
        JSON.stringify({ stamp: String(Date.now()) }, null, 2),
      );
    },
  };
}

await build({
  configFile: false,
  root,
  define: devDefine(),
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: mode === 'development',
    lib: {
      entry: resolve(root, 'extension/content-script.ts'),
      formats: ['iife'],
      name: 'Cc2lExtension',
      fileName: () => 'content-script.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        extend: true,
      },
    },
  },
  plugins: [extensionAssetsPlugin()],
});

await build({
  configFile: false,
  root,
  define: devDefine(),
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: mode === 'development',
    rollupOptions: {
      input: resolve(root, 'extension/service-worker.ts'),
      output: {
        format: 'es',
        entryFileNames: 'service-worker.js',
      },
    },
  },
});
