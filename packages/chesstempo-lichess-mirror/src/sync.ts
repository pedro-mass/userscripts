import { mirrorLog } from './log';
import type { MirrorPayload } from './types';

const PAYLOAD_KEY = 'ctLichessMirror.payload';
const TARGET_KEY = 'ctLichessMirror.targetId';
const SEQ_KEY = 'ctLichessMirror.seq';
const SESSION_MIRROR = 'pamMirrorId';

export function getMirrorSessionId(): string | null {
  return sessionStorage.getItem(SESSION_MIRROR);
}

export function setMirrorSessionId(id: string): void {
  sessionStorage.setItem(SESSION_MIRROR, id);
}

export function getTargetId(): string | null {
  const v = GM_getValue<string | undefined>(TARGET_KEY, undefined);
  return v?.trim() || null;
}

export function setTargetId(id: string): void {
  GM_setValue(TARGET_KEY, id);
}

export function publishFromCt(
  fen: string,
  prevFen: string | null,
  targetId: string,
): void {
  const seq = (GM_getValue<number>(SEQ_KEY, 0) || 0) + 1;
  GM_setValue(SEQ_KEY, seq);
  const payload: MirrorPayload = {
    v: 1,
    seq,
    from: 'ct',
    fen,
    prevFen,
    targetId,
    ts: Date.now(),
  };
  GM_setValue(PAYLOAD_KEY, payload);
  mirrorLog('debug', 'GM publish', { seq, targetId, fen });
}

export function onMirrorPayload(
  handler: (payload: MirrorPayload) => void,
): void {
  GM_addValueChangeListener(PAYLOAD_KEY, (_key, _old, newValue, remote) => {
    if (!remote || !newValue || typeof newValue !== 'object') return;
    const p = newValue as MirrorPayload;
    if (p.v !== 1 || p.from !== 'ct') return;
    handler(p);
  });
}

let lastAppliedSeq = 0;

export function shouldApply(payload: MirrorPayload): boolean {
  const targetId = getTargetId();
  if (!targetId || payload.targetId !== targetId) {
    mirrorLog('debug', 'skip apply: target mismatch', {
      have: targetId,
      want: payload.targetId,
    });
    return false;
  }
  if (payload.seq <= lastAppliedSeq) {
    mirrorLog('debug', 'skip apply: stale seq', {
      seq: payload.seq,
      lastAppliedSeq,
    });
    return false;
  }
  lastAppliedSeq = payload.seq;
  return true;
}
