import { installLiveCapture } from './live';
import { startUi } from './ui';

declare global {
  interface Window {
    __lpnLoaded?: boolean;
  }
}

if (window.__lpnLoaded) {
  /* CDP re-inject or double script tag */
} else {
  window.__lpnLoaded = true;
  installLiveCapture();
  startUi();
}
