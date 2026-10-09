import assert from 'node:assert/strict';
import { test } from 'node:test';

/** Mirrors sync.ts parsePayload (GM may stringify nested fields). */
function parsePayload(raw: unknown) {
  if (raw == null) return null;
  let obj: Record<string, unknown>;
  if (typeof raw === 'string') {
    obj = JSON.parse(raw) as Record<string, unknown>;
  } else if (typeof raw === 'object') {
    obj = raw as Record<string, unknown>;
  } else return null;
  if (Number(obj.v) !== 1 || obj.from !== 'ct') return null;
  const seq = Number(obj.seq);
  if (!Number.isFinite(seq) || typeof obj.fen !== 'string' || typeof obj.targetId !== 'string') {
    return null;
  }
  return { seq, fen: obj.fen, targetId: obj.targetId };
}

test('parsePayload accepts GM stringified v/seq', () => {
  const raw = {
    v: '1',
    seq: '12',
    from: 'ct',
    fen: 'start',
    targetId: 'abc',
    prevFen: null,
    ts: 1,
  };
  const p = parsePayload(raw);
  assert.equal(p?.seq, 12);
});
