import { countAll, exportJson, getByPositionKey, upsertMany } from './db';
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

let currentKey = '';
let mounted = false;

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function formatSource(hit: PositionNoteHit): string {
  const who =
    hit.white && hit.black ? `${hit.white} – ${hit.black}` : hit.chapterName;
  return [hit.studyName, who, hit.san ? `@ ${hit.san}` : ''].filter(Boolean).join(' · ');
}

async function renderPanel(hits: PositionNoteHit[]): Promise<void> {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;

  const list = panel.querySelector('.lpn-list');
  const count = panel.querySelector('.lpn-count');
  if (!list || !count) return;

  count.textContent = `${hits.length} prior note${hits.length === 1 ? '' : 's'} at this position`;

  list.replaceChildren();
  if (hits.length === 0) {
    list.appendChild(el('p', 'lpn-empty', 'No other indexed notes for this board.'));
    return;
  }

  const analysis = window.site?.analysis;
  const hereStudy = analysis?.study?.data.study.id;
  const hereChapter = analysis?.study?.vm.chapterId;
  const herePath = analysis?.path;

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
    #${PANEL_ID} { margin: 0.75rem 0; padding: 0.75rem; border: 1px solid var(--border, #404040); border-radius: 4px; }
    #${PANEL_ID} .lpn-title { font-weight: 600; margin-bottom: 0.35rem; }
    #${PANEL_ID} .lpn-toolbar { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; }
    #${PANEL_ID} .lpn-count { font-size: 0.85rem; opacity: 0.85; margin-bottom: 0.5rem; }
    #${PANEL_ID} .lpn-hit { margin-bottom: 0.65rem; padding-bottom: 0.65rem; border-bottom: 1px solid var(--border, #333); }
    #${PANEL_ID} .lpn-hit-meta { font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.25rem; }
    #${PANEL_ID} .lpn-hit-text { white-space: pre-wrap; }
    #${PANEL_ID} .lpn-status { font-size: 0.8rem; margin-top: 0.35rem; }
  `;
  document.head.appendChild(style);
}

function mountPanel(host: HTMLElement): void {
  if (document.getElementById(PANEL_ID)) return;

  injectStyles();
  const panel = el('div');
  panel.id = PANEL_ID;
  panel.appendChild(el('div', 'lpn-title', 'Position notes (indexed)'));

  const toolbar = el('div', 'lpn-toolbar');
  const importBtn = el(
    'button',
    'button',
    'Import this study',
  ) as HTMLButtonElement;
  importBtn.type = 'button';
  const exportBtn = el(
    'button',
    'button button-empty',
    'Export JSON',
  ) as HTMLButtonElement;
  exportBtn.type = 'button';
  const status = el('div', 'lpn-status');

  importBtn.addEventListener('click', async () => {
    const studyId = studyIdFromLocation();
    if (!studyId) {
      status.textContent = 'Not on a study page.';
      return;
    }
    importBtn.disabled = true;
    status.textContent = 'Fetching PGN…';
    try {
      const pgn = await fetchStudyPgn(studyId);
      const hits = hitsFromStudyPgn(pgn, studyId);
      await upsertMany(hits);
      const total = await countAll();
      status.textContent = `Imported ${hits.length} notes (${total} total in index).`;
      if (window.site?.analysis?.node?.fen) {
        currentKey = '';
        await refreshForFen(window.site.analysis.node.fen);
      }
    } catch (e) {
      status.textContent = e instanceof Error ? e.message : 'Import failed.';
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
  panel.append(toolbar, el('div', 'lpn-count', ''), el('div', 'lpn-list'), status);
  host.prepend(panel);
  mounted = true;
}

function tryMount(): void {
  const host = document.querySelector<HTMLElement>('div.study__comments');
  if (host) mountPanel(host);
}

export function startUi(): void {
  tryMount();
  const observer = new MutationObserver(() => tryMount());
  observer.observe(document.body, { childList: true, subtree: true });

  void waitForAnalysis().then(() => {
    const fen = window.site?.analysis?.node?.fen;
    if (fen) void refreshForFen(fen);

    window.lichess?.events?.on('analysis.change', (fen: unknown) => {
      if (typeof fen === 'string') void refreshForFen(fen);
    });
  });
}

export function isMounted(): boolean {
  return mounted;
}
