import { cleanupApp, startApp } from '../src/app';
import { initExtensionPlatform } from './platform';

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

void boot();

// Dev: service worker reloads extension on rebuild; refresh chess.com tab to pick up changes.
chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === 'DEV_RELOAD') {
    cleanupApp();
    startApp();
  }
});
