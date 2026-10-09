import { readFenFromChessBoard, readFenFromExplorerElement } from './ct-fen';
import {
  getLastAppliedSeq,
  getMirrorSessionId,
  getPublishedSeq,
  getTargetId,
} from './sync';

const PROBE_ID = 'pam-ct-mirror-probe';

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

export function writeDomProbe(partial: {
  lastFen?: string | null;
  seq?: number | null;
}): void {
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

  let el = document.getElementById(PROBE_ID) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = PROBE_ID;
    el.type = 'application/json';
    el.setAttribute('aria-hidden', 'true');
    document.documentElement.append(el);
  }
  el.textContent = JSON.stringify(state);
}

export function readDomProbeFromDocument(): MirrorProbeState | null {
  const el = document.getElementById(PROBE_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as MirrorProbeState;
  } catch {
    return null;
  }
}
