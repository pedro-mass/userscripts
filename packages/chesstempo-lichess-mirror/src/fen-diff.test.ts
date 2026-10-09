import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { positionKey, singleMoveUci } from './fen';

const START =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER_D4 =
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1';

describe('positionKey', () => {
  it('ignores halfmove clock', () => {
    const a = positionKey(START);
    const b = positionKey(START.replace('0 1', '0 9'));
    assert.equal(a, b);
  });
});

describe('singleMoveUci', () => {
  it('finds d4 from start', () => {
    const uci = singleMoveUci(START, AFTER_D4);
    assert.equal(uci, 'd2d4');
  });

  it('returns null for same position', () => {
    assert.equal(singleMoveUci(START, START), null);
  });
});
