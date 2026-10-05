import { countAll, countForStudy, exportJson, getByPositionKey, upsertMany } from './db';
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
const STATUS_CLEAR_MS = 4000;

let currentKey = '';
let statusTimer: number | undefined;

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

async function renderPanel(hits: PositionNoteHit[]): Promise<void> {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;

  const list = panel.querySelector<HTMLElement>('.lpn-list');
  const heading = panel.querySelector('.lpn-prior-heading');
  if (!list || !heading) return;

  if (hits.length === 0) {
    heading.textContent = 'No other indexed notes at this board';
    heading.classList.add('lpn-prior-heading--quiet');
    list.replaceChildren();
    list.hidden = true;
    return;
  }

  heading.textContent = `${hits.length} other note${hits.length === 1 ? '' : 's'} at this position`;
  heading.classList.remove('lpn-prior-heading--quiet');
  list.hidden = false;

  const analysis = window.site?.analysis;
  const hereStudy = analysis?.study?.data.study.id;
  const hereChapter = analysis?.study?.vm.chapterId;
  const herePath = analysis?.path;

  list.replaceChildren();
  for (const hit of hits) {
    const sameNode =
      hit.studyId === hereStudy &&
      hit.chapterId === hereChapter &&
      hit.path &&
      hit.path === herePath;

    const item = el('div', 'lpn-hit');
    const meta = el('div', 'lpn-hit-meta', formatSource(hit));
    const body = el('div', 'lpn-hit-text', hit.text);
    const actions = el('div', 'lpn-hit-actions');
    const go = el(
      'button',
      'button button-empty button-no-upper',
      'Go to note',
    ) as HTMLButtonElement;
    go.type = 'button';
    go.addEventListener('click', () => void jumpToHit(hit));
    actions.appendChild(go);
    if (sameNode) {
      meta.textContent += ' (this move)';
    }
    item.append(meta, body, actions);
    list.appendChild(item);
  }
}

async function refreshForFen(fen: string): Promise<void> {
  const key = positionKeyFromFen(fen);
  if (key === currentKey) return;
  currentKey = key;
  const hits = await getByPositionKey(key);
  await renderPanel(hits);
}

function injectStyles(): void {
  if (document.getElementById('lpn-styles')) return;
  const style = document.createElement('style');
  style.id = 'lpn-styles';
  style.textContent = `
    #${PANEL_ID} { margin: 0.65rem 0 0; padding: 0; border: 0; }
    #${PANEL_ID} .lpn-prior-heading { font-size: 0.85rem; font-weight: 600; margin: 0.5rem 0 0.35rem; }
    #${PANEL_ID} .lpn-prior-heading--quiet { font-weight: normal; opacity: 0.75; }
    #${PANEL_ID} .lpn-hit { margin-bottom: 0.65rem; padding-bottom: 0.65rem; border-bottom: 1px solid var(--border, #333); }
    #${PANEL_ID} .lpn-hit-meta { font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.25rem; }
    #${PANEL_ID} .lpn-hit-text { white-space: pre-wrap; font-size: 0.9rem; }
    #${PANEL_ID} .lpn-meta { margin-top: 0.75rem; font-size: 0.8rem; opacity: 0.9; }
    #${PANEL_ID} .lpn-meta summary { cursor: pointer; user-select: none; }
    #${PANEL_ID} .lpn-toolbar { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.5rem 0 0.25rem; }
    #${PANEL_ID} .lpn-status { min-height: 1.1em; margin-top: 0.25rem; opacity: 0.85; }
  `;
  document.head.appendChild(style);
}

function buildPanel(): HTMLElement {
  injectStyles();
  const panel = el('div');
  panel.id = PANEL_ID;

  const prior = el('section', 'lpn-prior');
  const heading = el('div', 'lpn-prior-heading', '');
  const list = el('div', 'lpn-list');
  prior.append(heading, list);

  const details = el('details', 'lpn-meta');
  const summary = el('summary', '', 'Position notes index');
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
  panel.append(prior, details);

  void refreshStudyMeta(summary, studyIdFromLocation());

  return panel;
}

/** Anchor after Lichess comment textarea (inside Snabbdom-managed study__comments). */
function commentFormAnchor(): HTMLFormElement | null {
  return document.querySelector<HTMLFormElement>(
    '.analyse__underboard .study__comments form.form3',
  );
}

function mountPanel(panel: HTMLElement): void {
  const form = commentFormAnchor();
  if (form?.parentElement) {
    if (panel.previousElementSibling === form) return;
    form.insertAdjacentElement('afterend', panel);
    return;
  }

  const underboard = document.querySelector<HTMLElement>('.analyse__underboard');
  const buttons = underboard?.querySelector('.study__buttons');
  if (!underboard || !buttons) return;

  const comments = underboard.querySelector('.study__comments');
  if (comments?.parentElement && underboard.contains(comments)) {
    if (panel.previousElementSibling === comments) return;
    comments.insertAdjacentElement('afterend', panel);
    return;
  }

  const toolPanel = buttons.nextElementSibling;
  if (toolPanel && underboard.contains(toolPanel)) {
    if (panel.previousElementSibling === toolPanel) return;
    toolPanel.insertAdjacentElement('beforebegin', panel);
  } else {
    buttons.insertAdjacentElement('afterend', panel);
  }
}

/** Snabbdom replaces study__comments; re-attach after the comment form when possible. */
function ensurePanel(): void {
  let panel = document.getElementById(PANEL_ID) as HTMLElement | null;
  if (panel?.isConnected) {
    mountPanel(panel);
    return;
  }

  if (panel) panel.remove();
  panel = buildPanel();
  mountPanel(panel);

  void waitForAnalysis().then(() => {
    const fen = window.site?.analysis?.node?.fen;
    if (fen) void refreshForFen(fen);
  });
}

export function startUi(): void {
  ensurePanel();
  const observer = new MutationObserver(() => ensurePanel());
  observer.observe(document.body, { childList: true, subtree: true });
  window.setInterval(ensurePanel, 800);

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
  return Boolean(panel?.isConnected);
}
