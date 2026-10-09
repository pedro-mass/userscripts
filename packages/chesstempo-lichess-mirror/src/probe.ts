import { readFenFromChessBoard, readFenFromExplorerElement } from './ct-fen';
import {
  getLastAppliedSeq,
  getMirrorSessionId,
  getPairingTargetId,
  getPublishedSeq,
} from './sync';
import { scriptVersion } from './version';

/** CDP/agents read JSON from a comment child (no attribute mutations). */
export const PROBE_WRAP_ID = 'pam-ct-mirror-wrap';
const PROBE_COMMENT_PREFIX = 'pam-ct-mirror-probe:';

export type MirrorProbeState = {
  v: 1;
  scriptVersion: string;
  host: string;
  path: string;
  ts: number;
  targetId: string | null;
  sessionId: string | null;
  pamMirrorUrl: string | null;
  lastFen: string | null;
  boardFen: string | null;
  explorerFen: string | null;
  seq: number | null;
  publishedSeq: number | null;
  lastAppliedSeq: number | null;
};

let lastProbeJson = '';

/** Remove legacy probe nodes that tripped extension attribute observers. */
export function removeLegacyProbeNodes(): void {
  document.getElementById('pam-ct-mirror-probe')?.remove();
}

function probeComment(anchor: HTMLElement): Comment | null {
  for (const n of Array.from(anchor.childNodes)) {
    if (n.nodeType !== Node.COMMENT_NODE) continue;
    const c = n as Comment;
    if (c.data.startsWith(PROBE_COMMENT_PREFIX)) return c;
  }
  return null;
}

/** Host for UI + probe comment; fixed on viewport, not inside CT custom elements. */
export function ensureProbeHost(): void {
  if (document.getElementById(PROBE_WRAP_ID)) return;
  const el = document.createElement('div');
  el.id = PROBE_WRAP_ID;
  el.style.cssText =
    'position:fixed;bottom:12px;right:12px;z-index:2147483646;display:flex;flex-direction:column;gap:6px;align-items:flex-end;max-width:min(360px,90vw);pointer-events:none;';
  const comment = document.createComment(`${PROBE_COMMENT_PREFIX}{}`);
  el.append(comment);
  document.body.append(el);
}

export function writeDomProbe(partial: {
  lastFen?: string | null;
  seq?: number | null;
}): void {
  const anchor = document.getElementById(PROBE_WRAP_ID);
  if (!anchor) return;

  const seq =
    partial.seq ??
    GM_getValue<number | null>('ctLichessMirror.seq', null) ??
    null;
  const state: MirrorProbeState = {
    v: 1,
    scriptVersion: scriptVersion(),
    host: location.hostname,
    path: location.pathname + location.search,
    ts: Date.now(),
    targetId: getPairingTargetId(),
    sessionId: getMirrorSessionId(),
    pamMirrorUrl: new URLSearchParams(location.search).get('pamMirror'),
    lastFen: partial.lastFen ?? null,
    boardFen: readFenFromChessBoard(),
    explorerFen: readFenFromExplorerElement(),
    seq,
    publishedSeq: getPublishedSeq(),
    lastAppliedSeq: getLastAppliedSeq(),
  };

  const json = JSON.stringify(state);
  if (json === lastProbeJson) return;
  lastProbeJson = json;

  let comment = probeComment(anchor);
  if (!comment) {
    comment = document.createComment(`${PROBE_COMMENT_PREFIX}${json}`);
    anchor.append(comment);
  } else {
    comment.data = `${PROBE_COMMENT_PREFIX}${json}`;
  }
}

export function readDomProbeFromDocument(): MirrorProbeState | null {
  const anchor = document.getElementById(PROBE_WRAP_ID);
  if (!anchor) return null;
  const comment = probeComment(anchor);
  if (!comment) return null;
  const raw = comment.data.slice(PROBE_COMMENT_PREFIX.length);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MirrorProbeState;
  } catch {
    return null;
  }
}

/** Parse probe JSON for CDP (comment or legacy data attr). */
export function readProbeJsonFromDom(): string | null {
  const anchor = document.getElementById(PROBE_WRAP_ID);
  if (anchor) {
    const comment = probeComment(anchor);
    if (comment) return comment.data.slice(PROBE_COMMENT_PREFIX.length);
    const legacy = anchor.getAttribute('data-pam-probe');
    if (legacy) return legacy;
  }
  return document.getElementById('pam-ct-mirror-probe')?.textContent ?? null;
}
