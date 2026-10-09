import { readFenFromChessBoard, readFenFromExplorerElement } from './ct-fen';
import {
  getLastAppliedSeq,
  getMirrorSessionId,
  getPublishedSeq,
  getTargetId,
} from './sync';

/** CDP/agents read JSON from this element's data attribute (no extra nodes on `<html>`). */
export const PROBE_WRAP_ID = 'pam-ct-mirror-wrap';
const PROBE_ATTR = 'data-pam-probe';

export type MirrorProbeState = {
  v: 1;
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

/** Lichess has no mirror UI; use a zero-size host on `body` once. */
export function ensureProbeHost(): void {
  if (document.getElementById(PROBE_WRAP_ID)) return;
  const el = document.createElement('div');
  el.id = PROBE_WRAP_ID;
  el.style.cssText =
    'position:fixed;width:0;height:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
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
    host: location.hostname,
    path: location.pathname + location.search,
    ts: Date.now(),
    targetId: getTargetId(),
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
  anchor.setAttribute(PROBE_ATTR, json);
}

export function readDomProbeFromDocument(): MirrorProbeState | null {
  const anchor = document.getElementById(PROBE_WRAP_ID);
  const raw = anchor?.getAttribute(PROBE_ATTR);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MirrorProbeState;
  } catch {
    return null;
  }
}
