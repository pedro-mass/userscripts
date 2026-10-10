import { mirrorLog } from './log';
import type { BottomColor } from './types';

type ChessBoardEl = HTMLElement & { toFen?: () => string };
type ExplorerEl = HTMLElement & { fen?: string; setPosition?: (fen: string) => void };

/** CT `chess-board`: black at bottom when flipped (class or attribute). */
export function bottomColorFromBoardElement(
  board: Pick<Element, 'classList' | 'getAttribute' | 'hasAttribute'> | null,
): BottomColor {
  if (!board) return 'white';
  if (board.classList.contains('flipped')) return 'black';
  const flippedAttr = board.getAttribute('flipped');
  if (flippedAttr === 'true' || flippedAttr === '') return 'black';
  if (board.hasAttribute('flipped') && flippedAttr !== 'false') {
    return 'black';
  }
  return 'white';
}

export function readBottomColorFromBoard(): BottomColor {
  return bottomColorFromBoardElement(document.querySelector('chess-board'));
}

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
    chessBoard: !!board,
    domProbe: (() => {
      const wrap = document.getElementById('pam-ct-mirror-wrap');
      if (!wrap) return undefined;
      for (const n of Array.from(wrap.childNodes)) {
        if (n.nodeType !== Node.COMMENT_NODE) continue;
        const c = n as Comment;
        if (c.data.startsWith('pam-ct-mirror-probe:')) {
          return c.data.slice('pam-ct-mirror-probe:'.length).slice(0, 120);
        }
      }
      return wrap.getAttribute('data-pam-probe')?.slice(0, 120);
    })(),
    toFen: readFenFromChessBoard(),
    pageHookFlag: !!(window as Window & { __pamCtPageHook?: boolean })
      .__pamCtPageHook,
    injectFlag: document.documentElement.dataset.pamCtPageHookInjected,
  };
}
