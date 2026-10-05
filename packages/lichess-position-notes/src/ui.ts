import {
  collapseStudyPositionRows,
  countAll,
  countForStudy,
  exportJson,
  getByPositionKey,
  upsertMany,
} from './db';
import { hitsFromStudyPgn } from './ingest-pgn';
import {
  fetchStudyPgn,
  jumpToHit,
  studyIdFromLocation,
  waitForAnalysis,
} from './lichess';
import { positionKeyFromFen } from './position-key';
import type { PositionNoteHit } from './types';

const PANEL_ID = 'lpn-position-notes-panel';
const LPN_VERSION = '1.0.0';
const STATUS_CLEAR_MS = 4000;
const ENSURE_BACKUP_MS = 3000;

let currentKey = '';
let currentChapterId = '';
let statusTimer: number | undefined;
let panelBuilt = false;
let ensureQueued = false;
let underboardObserver: MutationObserver | null = null;
let refreshToken = 0;

function panelRoot(panel: HTMLElement): ShadowRoot | HTMLElement {
  return panel.shadowRoot ?? panel;
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function formatSource(hit: PositionNoteHit): string {
  const who =
    hit.white && hit.black ? `${hit.white} – ${hit.black}` : hit.chapterName;
  return [hit.studyName, who, hit.san ? `@ ${hit.san}` : '']
    .filter(Boolean)
    .join(' · ');
}

function setTransientStatus(status: HTMLElement, message: string): void {
  status.textContent = message;
  if (statusTimer) window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    status.textContent = '';
  }, STATUS_CLEAR_MS);
}

async function refreshStudyMeta(
  summary: HTMLElement,
  studyId: string | null,
): Promise<void> {
  if (!studyId) {
    summary.textContent = 'Position notes index';
    return;
  }
  const [inStudy, total] = await Promise.all([
    countForStudy(studyId),
    countAll(),
  ]);
  if (inStudy > 0) {
    summary.textContent = `Index · ${inStudy} in this study · ${total} total`;
  } else {
    summary.textContent = `Index · ${total} note${total === 1 ? '' : 's'} (study not imported)`;
  }
}

/** List is for other chapters only; this node is already in the Lichess comment box. */
function isCurrentChapterNote(hit: PositionNoteHit): boolean {
  const study = window.site?.analysis?.study;
  if (!study) return false;
  return (
    hit.studyId === study.data?.id && hit.chapterId === study.vm.chapterId
  );
}

/** One row per other chapter (newest wins); drops stale live edit duplicates. */
function dedupeNewestPerChapter(hits: PositionNoteHit[]): PositionNoteHit[] {
  const byChapter = new Map<string, PositionNoteHit>();
  for (const hit of hits) {
    const key = hit.chapterId || hit.chapterUrl;
    const prev = byChapter.get(key);
    if (!prev || hit.updatedAt > prev.updatedAt) byChapter.set(key, hit);
  }
  return [...byChapter.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

function hitsForDisplay(hits: PositionNoteHit[]): PositionNoteHit[] {
  const others = hits.filter((hit) => !isCurrentChapterNote(hit));
  return dedupeNewestPerChapter(others);
}

function headingForVisible(count: number): string {
  if (count === 0) return 'No notes from other chapters at this board';
  const n = count === 1 ? '1 note' : `${count} notes`;
  return `${n} from other chapters at this position`;
}

function listNeedsPaint(hits: PositionNoteHit[]): boolean {
  const visible = hitsForDisplay(hits);
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return false;
  const list = panelRoot(panel).querySelector('.lpn-list');
  if (!list) return true;
  return list.childElementCount !== visible.length;
}

function paintHitList(hits: PositionNoteHit[]): void {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;

  const root = panelRoot(panel);
  const list = root.querySelector<HTMLElement>('.lpn-list');
  const heading = root.querySelector<HTMLElement>('.lpn-prior-heading');
  if (!list || !heading) return;

  const visible = hitsForDisplay(hits);

  if (visible.length === 0) {
    heading.textContent = headingForVisible(0);
    heading.classList.add('lpn-prior-heading--quiet');
    list.replaceChildren();
    return;
  }

  list.replaceChildren();
  for (const hit of visible) {
    const item = el('div', 'lpn-hit');
    const go = el('button', 'lpn-hit-go', '↗') as HTMLButtonElement;
    go.type = 'button';
    go.title = 'Open this note';
    go.setAttribute('aria-label', 'Open this note');
    go.addEventListener('click', () => void jumpToHit(hit));
    const meta = el('div', 'lpn-hit-meta', formatSource(hit));
    const body = el('div', 'lpn-hit-text', hit.text);
    item.append(go, meta, body);
    list.appendChild(item);
  }

  heading.textContent = headingForVisible(visible.length);
  heading.classList.remove('lpn-prior-heading--quiet');
}

async function refreshForFen(fen: string, force = false): Promise<void> {
  const key = positionKeyFromFen(fen);
  const chapterId = window.site?.analysis?.study?.vm.chapterId ?? '';
  const token = ++refreshToken;
  const hits = await getByPositionKey(key);
  if (token !== refreshToken) return;
  if (!document.getElementById(PANEL_ID)) return;

  const chapterChanged = chapterId !== currentChapterId;
  const repaint =
    force || key !== currentKey || chapterChanged || listNeedsPaint(hits);
  currentKey = key;
  currentChapterId = chapterId;
  if (!repaint) return;

  paintHitList(hits);
  requestAnimationFrame(() => {
    if (listNeedsPaint(hits)) paintHitList(hits);
  });
}

function refreshForCurrentFen(force = false): void {
  const fen = window.site?.analysis?.node?.fen;
  if (fen) void refreshForFen(fen, force);
}

function panelStyleText(): string {
  return `
    :host { display: block; margin: 0.65rem 0 0; padding: 0; border: 0; color: inherit; }
    .lpn-prior { margin: 0.5rem 0 0; display: block; }
    .lpn-prior-heading { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.35rem; }
    .lpn-list { display: block; min-height: 0.25rem; }
    .lpn-prior-heading--quiet { font-weight: normal; opacity: 0.75; }
    .lpn-hit { position: relative; margin-bottom: 0.65rem; padding: 0 1.6rem 0.65rem 0; border-bottom: 1px solid var(--border, #333); }
    .lpn-hit-go { position: absolute; top: 0; right: 0; padding: 0.1rem 0.25rem; border: 0; background: transparent; color: inherit; font-size: 1rem; line-height: 1; cursor: pointer; opacity: 0.75; }
    .lpn-hit-go:hover { opacity: 1; }
    .lpn-hit-meta { font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.25rem; padding-right: 0.25rem; }
    .lpn-hit-text { white-space: pre-wrap; font-size: 0.9rem; }
    .lpn-meta { margin-top: 0.75rem; font-size: 0.8rem; opacity: 0.9; }
    .lpn-meta summary { cursor: pointer; user-select: none; }
    .lpn-toolbar { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.5rem 0 0.25rem; }
    .lpn-status { min-height: 1.1em; margin-top: 0.25rem; opacity: 0.85; }
    .button { cursor: pointer; font: inherit; padding: 0.35em 0.65em; border-radius: 3px; border: 1px solid var(--border, #555); background: var(--bg-box, #2a2a2a); color: inherit; }
    .button-empty { background: transparent; }
    .button-no-upper { text-transform: none; }
  `;
}

function buildPanel(): HTMLElement {
  const panel = el('div');
  panel.id = PANEL_ID;
  const shadow = panel.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = panelStyleText();
  shadow.appendChild(style);

  const prior = el('section', 'lpn-prior');
  const heading = el('div', 'lpn-prior-heading', '');
  const list = el('div', 'lpn-list');
  prior.append(heading, list);

  const details = el('details', 'lpn-meta');
  const summary = el('summary', '', `Position notes · v${LPN_VERSION}`);
  const toolbar = el('div', 'lpn-toolbar');
  const importBtn = el(
    'button',
    'button button-empty button-no-upper',
    'Import this study',
  ) as HTMLButtonElement;
  importBtn.type = 'button';
  const exportBtn = el(
    'button',
    'button button-empty button-no-upper',
    'Export JSON',
  ) as HTMLButtonElement;
  exportBtn.type = 'button';
  const status = el('div', 'lpn-status');

  importBtn.addEventListener('click', async () => {
    const studyId = studyIdFromLocation();
    if (!studyId) {
      setTransientStatus(status, 'Not on a study page.');
      return;
    }
    importBtn.disabled = true;
    status.textContent = 'Fetching PGN…';
    try {
      const pgn = await fetchStudyPgn(studyId);
      const hits = hitsFromStudyPgn(pgn, studyId);
      await upsertMany(hits);
      await collapseStudyPositionRows(studyId);
      window.dispatchEvent(new CustomEvent('lpn-db-changed'));
      await refreshStudyMeta(summary, studyId);
      setTransientStatus(
        status,
        `Imported ${hits.length} notes from this study.`,
      );
      if (window.site?.analysis?.node?.fen) {
        currentKey = '';
        await refreshForFen(window.site.analysis.node.fen);
      }
    } catch (e) {
      setTransientStatus(
        status,
        e instanceof Error ? e.message : 'Import failed.',
      );
    } finally {
      importBtn.disabled = false;
    }
  });

  exportBtn.addEventListener('click', async () => {
    const json = await exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lichess-position-notes.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  toolbar.append(importBtn, exportBtn);
  details.append(summary, toolbar, status);
  shadow.append(prior, details);

  void refreshStudyMeta(summary, studyIdFromLocation());
  panelBuilt = true;

  return panel;
}

function underboardRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.analyse__underboard');
}

/** Outside Snabbdom's study__comments tree — directly after the comments panel. */
function isPanelPlaced(panel: HTMLElement): boolean {
  const underboard = underboardRoot();
  if (!underboard?.contains(panel)) return false;
  const comments = underboard.querySelector('.study__comments');
  return Boolean(comments && panel.previousElementSibling === comments);
}

function mountPanel(panel: HTMLElement): boolean {
  const underboard = underboardRoot();
  if (!underboard) return false;

  const comments = underboard.querySelector('.study__comments');
  if (comments?.parentElement && underboard.contains(comments)) {
    if (panel.previousElementSibling === comments && panel.parentElement === underboard) {
      return true;
    }
    comments.insertAdjacentElement('afterend', panel);
    return true;
  }

  const buttons = underboard.querySelector('.study__buttons');
  if (!buttons) return false;

  const afterButtons = buttons.nextElementSibling;
  if (afterButtons && panel.previousElementSibling === afterButtons) return true;
  if (afterButtons) {
    afterButtons.insertAdjacentElement('afterend', panel);
  } else {
    buttons.insertAdjacentElement('afterend', panel);
  }
  return true;
}

function ensurePanelNow(): void {
  let panel = document.getElementById(PANEL_ID) as HTMLElement | null;
  if (panel?.isConnected && isPanelPlaced(panel)) return;

  if (!panelBuilt || !panel) {
    if (panel) panel.remove();
    panel = buildPanel();
  } else if (panel && !panel.isConnected) {
    /* keep single built panel; re-mount below */
  }

  if (!panel) return;
  mountPanel(panel);
  refreshForCurrentFen(true);
}

function scheduleEnsurePanel(): void {
  if (ensureQueued) return;
  ensureQueued = true;
  requestAnimationFrame(() => {
    ensureQueued = false;
    ensurePanelNow();
  });
}

function watchUnderboard(): void {
  const root = underboardRoot();
  if (!root) return;
  if (underboardObserver) return;

  underboardObserver = new MutationObserver((records) => {
    const panel = document.getElementById(PANEL_ID);
    if (panel?.isConnected && isPanelPlaced(panel)) return;

    for (const record of records) {
      if (record.type !== 'childList') continue;
      for (const node of Array.from(record.addedNodes)) {
        if (node instanceof HTMLElement) {
          if (
            node.classList.contains('study__comments') ||
            node.querySelector?.('.study__comments')
          ) {
            scheduleEnsurePanel();
            return;
          }
        }
      }
    }
    if (!panel?.isConnected) scheduleEnsurePanel();
  });

  underboardObserver.observe(root, { childList: true, subtree: false });
}

function waitForUnderboard(): void {
  const poll = (): void => {
    const root = underboardRoot();
    if (!root) {
      window.setTimeout(poll, 200);
      return;
    }
    watchUnderboard();
    scheduleEnsurePanel();
    ensurePanelNow();
  };
  poll();
}

/** Snabbdom owns study__comments; we stay a sibling under analyse__underboard. */
function startPanelWatch(): void {
  waitForUnderboard();

  window.setInterval(() => {
    const panel = document.getElementById(PANEL_ID);
    if (panel?.isConnected && isPanelPlaced(panel)) return;
    if (underboardRoot()) watchUnderboard();
    scheduleEnsurePanel();
  }, ENSURE_BACKUP_MS);
}

export function startUi(): void {
  startPanelWatch();

  window.addEventListener('lpn-db-changed', () => {
    currentKey = '';
    currentChapterId = '';
    refreshForCurrentFen(true);
  });

  void waitForAnalysis().then(() => {
    const fen = window.site?.analysis?.node?.fen;
    if (fen) void refreshForFen(fen);

    window.lichess?.events?.on('analysis.change', (fen: unknown) => {
      if (typeof fen === 'string') void refreshForFen(fen);
    });
  });
}

export function isMounted(): boolean {
  const panel = document.getElementById(PANEL_ID);
  return Boolean(panel?.isConnected && isPanelPlaced(panel));
}
