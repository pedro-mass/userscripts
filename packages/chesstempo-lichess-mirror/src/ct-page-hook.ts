import { mirrorLog } from './log';

type ExplorerEl = HTMLElement & {
  fen?: string;
  setPosition?: (fen: string) => void;
};

const hookedExplorers = new WeakSet<object>();

export function hookOpeningExplorerSetPosition(
  onFen: (fen: string) => void,
): void {
  const hookOne = (explorer: ExplorerEl) => {
    if (!explorer.setPosition || hookedExplorers.has(explorer)) return;
    hookedExplorers.add(explorer);
    const orig = explorer.setPosition.bind(explorer);
    explorer.setPosition = (fen: string) => {
      orig(fen);
      if (fen) onFen(fen);
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

  let debounce: ReturnType<typeof setTimeout> | null = null;
  new MutationObserver(() => {
    if (debounce) return;
    debounce = setTimeout(() => {
      debounce = null;
      const el = document.querySelector<ExplorerEl>('opening-explorer');
      if (!el || hookedExplorers.has(el)) return;
      scan();
    }, 300);
  }).observe(document.documentElement, { childList: true, subtree: true });
}
