import { parsePamMirrorParam } from './fen';
import { mirrorLog } from './log';
import type { BottomColor, MirrorPayload } from './types';

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

/** Pairing id for matching incoming payloads to this tab. */
export function getPairingTargetId(): string | null {
  if (location.hostname === 'lichess.org') {
    return (
      parsePamMirrorParam() ||
      getMirrorSessionId() ||
      getTargetId() ||
      null
    );
  }
  return getTargetId() || getMirrorSessionId() || parsePamMirrorParam() || null;
}

export function setTargetId(id: string): void {
  GM_setValue(TARGET_KEY, id);
}

export function getLatestPayload(): MirrorPayload | null {
  const v = GM_getValue<MirrorPayload | undefined>(PAYLOAD_KEY, undefined);
  if (!v || typeof v !== 'object' || v.v !== 1 || v.from !== 'ct') return null;
  return v;
}

export function getPublishedSeq(): number {
  return GM_getValue<number>(SEQ_KEY, 0) || 0;
}

export function publishFromCt(
  fen: string,
  prevFen: string | null,
  targetId: string,
  bottomColor?: BottomColor,
): void {
  const seq = getPublishedSeq() + 1;
  GM_setValue(SEQ_KEY, seq);
  const payload: MirrorPayload = {
    v: 1,
    seq,
    from: 'ct',
    fen,
    prevFen,
    targetId,
    bottomColor,
    ts: Date.now(),
  };
  GM_setValue(PAYLOAD_KEY, payload);
  mirrorLog('debug', 'GM publish', { seq, targetId, fen });
}

export function onMirrorPayload(
  handler: (payload: MirrorPayload) => void,
): void {
  GM_addValueChangeListener(PAYLOAD_KEY, (_key, _old, newValue) => {
    if (!newValue || typeof newValue !== 'object') return;
    const p = newValue as MirrorPayload;
    if (p.v !== 1 || p.from !== 'ct') return;
    handler(p);
  });
}

let lastAppliedSeq = 0;

export function getLastAppliedSeq(): number {
  return lastAppliedSeq;
}

export function payloadMatchesSession(payload: MirrorPayload): boolean {
  const targetId = getPairingTargetId();
  return !!(targetId && payload.targetId === targetId);
}

/** True when this payload should be applied (does not advance seq until mark). */
export function shouldApply(payload: MirrorPayload): boolean {
  if (!payloadMatchesSession(payload)) {
    mirrorLog('debug', 'skip apply: target mismatch', {
      have: getPairingTargetId(),
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
  return true;
}

export function markPayloadApplied(seq: number): void {
  if (seq > lastAppliedSeq) lastAppliedSeq = seq;
}
