import { cleanupApp, startApp } from '../src/app';
import { initExtensionPlatform } from './platform';

interface DevReloadMessage {
  type: 'DEV_RELOAD';
  appChunk: string;
}

async function boot(): Promise<void> {
  await initExtensionPlatform();
  document.documentElement.dataset.cc2lExtension = '1';

  if (typeof GM_info !== 'undefined') {
    console.warn(
      '[cc2l] Userscript detected; extension takes precedence. Disable the userscript to avoid duplicate UI.',
    );
  }

  startApp();
}

async function warmReload(appChunk: string): Promise<void> {
  cleanupApp();
  const url = `${chrome.runtime.getURL(appChunk)}?t=${Date.now()}`;
  const mod = await import(/* @vite-ignore */ url);
  if (typeof mod.startApp === 'function') {
    mod.startApp();
  }
}

void boot();

chrome.runtime.onMessage.addListener((message: DevReloadMessage) => {
  if (message.type !== 'DEV_RELOAD') return;
  void warmReload(message.appChunk);
});
