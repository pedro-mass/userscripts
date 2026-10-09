import { mirrorLog } from './log';

type ChessBoardEl = HTMLElement & { toFen?: () => string };
type ExplorerEl = HTMLElement & { fen?: string; setPosition?: (fen: string) => void };

export function readFenFromChessBoard(): string | null {
  const board = document.querySelector<ChessBoardEl>('chess-board');
  if (!board?.toFen) return null;
  try {
    const fen = board.toFen();
    return fen?.includes('/') ? fen : null;
  } catch (e) {
    mirrorLog('warn', 'chess-board.toFen failed', { err: String(e) });
    return null;
  }
}

export function readFenFromExplorerElement(): string | null {
  const explorer = document.querySelector<ExplorerEl>('opening-explorer');
  if (!explorer) return null;
  const fromData = explorer.getAttribute('data-pam-mirror-fen');
  if (fromData) return fromData;
  if (explorer.fen) return explorer.fen;
  return null;
}

/** Best-effort current position on CT opening training. */
export function readCurrentCtFen(lastFen: string | null): string | null {
  if (lastFen) return lastFen;
  const fromExplorer = readFenFromExplorerElement();
  if (fromExplorer) return fromExplorer;
  const fromBoard = readFenFromChessBoard();
  return fromBoard;
}

export function fenDiagnostics(): Record<string, unknown> {
  const explorer = document.querySelector<HTMLElement>('opening-explorer');
  const board = document.querySelector('chess-board');
  return {
    openingExplorer: !!explorer,
    explorerHook: explorer?.dataset.pamMirrorPageHook === '1',
    dataPamFen: explorer?.getAttribute('data-pam-mirror-fen'),
    chessBoard: !!board,
    toFen: readFenFromChessBoard(),
    pageHookFlag: !!(window as Window & { __pamCtPageHook?: boolean })
      .__pamCtPageHook,
    injectFlag: document.documentElement.dataset.pamCtPageHookInjected,
  };
}
