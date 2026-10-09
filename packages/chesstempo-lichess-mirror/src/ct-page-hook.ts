import { mirrorLog } from './log';

type ExplorerEl = HTMLElement & {
  fen?: string;
  setPosition?: (fen: string) => void;
};

export function hookOpeningExplorerSetPosition(
  onFen: (fen: string) => void,
): void {
  const hookOne = (explorer: ExplorerEl) => {
    if (!explorer.setPosition || explorer.dataset.pamMirrorPageHook === '1') {
      return;
    }
    explorer.dataset.pamMirrorPageHook = '1';
    const orig = explorer.setPosition.bind(explorer);
    explorer.setPosition = (fen: string) => {
      orig(fen);
      if (fen) {
        explorer.setAttribute('data-pam-mirror-fen', fen);
        onFen(fen);
      }
    };
    if (explorer.fen) onFen(explorer.fen);
    mirrorLog('debug', 'hooked opening-explorer.setPosition');
  };

  const scan = () => {
    const el = document.querySelector<ExplorerEl>('opening-explorer');
    if (el) hookOne(el);
  };

  scan();
  customElements.whenDefined('opening-explorer').then(scan);
  new MutationObserver(scan).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
