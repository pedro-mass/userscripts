import { PGN_SELECTORS } from '../config';
import { waitForElement } from '../wait-for-element';

export function normalizePgn(pgn: string): string {
  if (pgn.includes(' won on time')) {
    return pgn.replace(/Termination "[^"]+"/g, 'Termination "Time forfeit"');
  }
  return pgn.replace(/Termination "[^"]+"/g, 'Termination "Normal"');
}

async function openShareDialog(): Promise<void> {
  const secondaryBtn = document.querySelector<HTMLElement>(
    PGN_SELECTORS.secondaryMenu,
  );
  if (secondaryBtn) {
    secondaryBtn.click();
    await waitForElement<HTMLElement>(PGN_SELECTORS.shareBtn);
  }

  const shareBtn = document.querySelector<HTMLElement>(PGN_SELECTORS.shareBtn);
  if (!shareBtn) throw new Error('Share button not found');

  shareBtn.click();
  await waitForElement(`${PGN_SELECTORS.pgnTab}, ${PGN_SELECTORS.textarea}`);
}

async function openPgnTab(): Promise<void> {
  if (document.querySelector(PGN_SELECTORS.pgnTabActive)) return;

  const pgnTab =
    document.querySelector<HTMLElement>(PGN_SELECTORS.pgnTab) ??
    Array.from(
      document.querySelectorAll<HTMLElement>(PGN_SELECTORS.dialogButtons),
    ).find((el) => el.textContent?.trim() === 'PGN');

  if (pgnTab) {
    pgnTab.click();
    await waitForElement(PGN_SELECTORS.textarea);
  }
}

function closeShareDialog(): void {
  document.querySelector<HTMLElement>(PGN_SELECTORS.closeBtn)?.click();
}

function readTextareaValue(ta: HTMLTextAreaElement): string {
  return (
    ta.value ||
    ta.getAttribute('value') ||
    ta.textContent ||
    ''
  ).trim();
}

async function readPgnFromTextarea(): Promise<string> {
  const timestampsCheckbox = document.querySelector<HTMLInputElement>(
    PGN_SELECTORS.timestampsCheckbox,
  );
  if (timestampsCheckbox?.checked) {
    timestampsCheckbox.click();
  }

  const textarea = await waitForElement<HTMLTextAreaElement>(
    PGN_SELECTORS.textarea,
    {
      predicate: (el) => readTextareaValue(el).length > 0,
    },
  );

  return readTextareaValue(textarea);
}

/** Read PGN when the share modal is already open (share-tab export button). */
export async function extractPgnFromOpenShareModal(): Promise<string> {
  await openPgnTab();
  const pgn = normalizePgn(await readPgnFromTextarea());
  if (!/^\s*\[Event /m.test(pgn)) {
    throw new Error('PGN not ready in share dialog');
  }
  return pgn;
}

/** Opens share dialog, reads PGN, closes dialog. */
export async function extractPgnViaShareFlow(): Promise<string> {
  await openShareDialog();
  await openPgnTab();

  let pgn: string;
  try {
    pgn = normalizePgn(await readPgnFromTextarea());
  } finally {
    closeShareDialog();
  }

  return pgn;
}

/** Callback API fallback when share UI is unavailable. */
export async function fetchPgnFromCallbackApi(
  gameId: string,
): Promise<string> {
  const kinds = ['live', 'daily'];
  for (const kind of kinds) {
    const url = `https://www.chess.com/callback/${kind}/game/${gameId}`;
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) continue;
      const data = (await response.json()) as { game?: { pgn?: string } };
      const pgn = data.game?.pgn;
      if (pgn?.trim()) return normalizePgn(pgn);
    } catch {
      // try next kind
    }
  }
  throw new Error('Could not load PGN from chess.com API');
}

export async function resolvePgn(gameId: string | null): Promise<string> {
  const openTextarea = document.querySelector<HTMLTextAreaElement>(
    PGN_SELECTORS.textarea,
  );
  if (openTextarea && readTextareaValue(openTextarea).length > 0) {
    try {
      return await extractPgnFromOpenShareModal();
    } catch {
      // fall through
    }
  }

  try {
    return await extractPgnViaShareFlow();
  } catch (shareError) {
    if (!gameId) throw shareError;
    return fetchPgnFromCallbackApi(gameId);
  }
}
