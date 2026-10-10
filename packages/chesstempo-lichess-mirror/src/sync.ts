import { parsePamMirrorParam } from './fen';
import { mirrorLog } from './log';
import type { BottomColor, MirrorPayload } from './types';

const PAYLOAD_KEY = 'ctLichessMirror.payload';
const TARGET_KEY = 'ctLichessMirror.targetId';
const SEQ_KEY = 'ctLichessMirror.seq';
const APPLIED_SEQ_KEY = 'ctLichessMirror.lastAppliedSeq';
const SESSION_MIRROR = 'pamMirrorId';

function parsePayload(raw: unknown): MirrorPayload | null {
  if (raw == null) return null;
  let obj: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof raw === 'object') {
    obj = raw as Record<string, unknown>;
  } else {
    return null;
  }
  if (Number(obj.v) !== 1 || obj.from !== 'ct') return null;
  const seq = Number(obj.seq);
  const fen = obj.fen;
  const targetId = obj.targetId;
  if (!Number.isFinite(seq) || typeof fen !== 'string' || typeof targetId !== 'string') {
    return null;
  }
  const prevFen = obj.prevFen;
  const bottomColor = obj.bottomColor;
  return {
    v: 1,
    seq,
    from: 'ct',
    fen,
    prevFen: typeof prevFen === 'string' ? prevFen : prevFen == null ? null : null,
    targetId,
    bottomColor:
      bottomColor === 'white' || bottomColor === 'black' ? bottomColor : undefined,
    ts: Number(obj.ts) || Date.now(),
  };
}

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
  return parsePayload(GM_getValue(PAYLOAD_KEY, undefined));
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

function appliedSeqStorageKey(targetId: string): string {
  return `${APPLIED_SEQ_KEY}.${targetId}`;
}

export function loadLastAppliedSeqForTarget(targetId: string | null): number {
  if (!targetId) return 0;
  const n = Number(GM_getValue(appliedSeqStorageKey(targetId), 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function persistLastAppliedSeq(targetId: string, seq: number): void {
  GM_setValue(appliedSeqStorageKey(targetId), seq);
}

export function onMirrorPayload(
  handler: (payload: MirrorPayload) => void,
): void {
  GM_addValueChangeListener(PAYLOAD_KEY, (_key, _old, newValue) => {
    const p = parsePayload(newValue);
    if (!p) return;
    handler(p);
  });
}

let lastAppliedSeq = 0;

export function initLastAppliedSeqFromStorage(): void {
  const targetId = getPairingTargetId();
  lastAppliedSeq = loadLastAppliedSeqForTarget(targetId);
}

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

export function markPayloadApplied(seq: number, targetId?: string): void {
  const tid = targetId ?? getPairingTargetId();
  if (seq > lastAppliedSeq) lastAppliedSeq = seq;
  if (tid && seq > 0) persistLastAppliedSeq(tid, seq);
}

/** For CDP probe / debugging drain decisions. */
export function drainDiagnostics(): {
  hasPayload: boolean;
  payloadSeq: number | null;
  payloadFen: string | null;
  payloadTarget: string | null;
  pairingTarget: string | null;
  matches: boolean;
  wouldApply: boolean;
} {
  const p = getLatestPayload();
  const pairingTarget = getPairingTargetId();
  const matches = !!(p && payloadMatchesSession(p));
  return {
    hasPayload: !!p,
    payloadSeq: p?.seq ?? null,
    payloadFen: p?.fen ?? null,
    payloadTarget: p?.targetId ?? null,
    pairingTarget,
    matches,
    wouldApply: !!(p && shouldApply(p)),
  };
}
