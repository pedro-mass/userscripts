import { mirrorLog } from './log';

type ExplorerEl = HTMLElement & {
  fen?: string;
  setPosition?: (fen: string) => void;
};

const hookedExplorers = new WeakSet<object>();

export function hookOpeningExplorerSetPosition(
  onFen: (fen: string) => void,
): void {
  const hookOne = (explorer: ExplorerEl): boolean => {
    if (!explorer.setPosition || hookedExplorers.has(explorer)) return false;
    hookedExplorers.add(explorer);
    const orig = explorer.setPosition.bind(explorer);
    explorer.setPosition = (fen: string) => {
      orig(fen);
      if (fen) onFen(fen);
    };
    if (explorer.fen) onFen(explorer.fen);
    mirrorLog('debug', 'hooked opening-explorer.setPosition');
    return true;
  };

  const scan = (): boolean => {
    const el = document.querySelector<ExplorerEl>('opening-explorer');
    return el ? hookOne(el) : false;
  };

  if (scan()) return;

  customElements.whenDefined('opening-explorer').then(scan);

  let tries = 0;
  const interval = setInterval(() => {
    if (scan() || ++tries >= 40) clearInterval(interval);
  }, 500);
}
