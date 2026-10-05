import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PositionNoteHit } from './types';
import {
  collapseHitsToSlots,
  mergeHitsForSlot,
  slotId,
  withSlotId,
} from './slot-id';

function hit(partial: Partial<PositionNoteHit> & { chapterId: string }): PositionNoteHit {
  const positionKey = partial.positionKey ?? 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
  const studyId = partial.studyId ?? 'study1';
  const chapterId = partial.chapterId;
  return {
    id: partial.id ?? 'legacy',
    positionKey,
    fenFull: partial.fenFull ?? positionKey,
    text: partial.text ?? 'note',
    studyId,
    studyName: 'S',
    chapterId,
    chapterName: 'C',
    path: partial.path ?? '',
    ply: 1,
    san: 'e4',
    uciTrail: [],
    onMainline: true,
    chapterUrl: `https://lichess.org/study/${studyId}/${chapterId}`,
    positionUrl: '',
    source: partial.source ?? 'import',
    importedAt: 0,
    updatedAt: partial.updatedAt ?? 0,
    ...partial,
  };
}

describe('slotId', () => {
  it('formats study|chapter|positionKey', () => {
    const key = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    assert.equal(slotId('abc', 'ch1', key), `abc|ch1|${key}`);
  });
});

describe('collapseHitsToSlots', () => {
  it('keeps one row per chapter at same position', () => {
    const key = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const merged = collapseHitsToSlots([
      hit({ chapterId: 'chA', text: 'old', updatedAt: 10, id: 'import|old' }),
      hit({ chapterId: 'chA', text: 'new', updatedAt: 20, id: 'import|new' }),
      hit({ chapterId: 'chB', text: 'b', updatedAt: 5, positionKey: key }),
    ]);
    assert.equal(merged.length, 2);
    const chA = merged.find((h) => h.chapterId === 'chA');
    assert.equal(chA?.text, 'new');
    assert.equal(chA?.id, slotId('study1', 'chA', key));
  });
});

describe('mergeHitsForSlot', () => {
  it('prefers live on updatedAt tie', () => {
    const key = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const merged = mergeHitsForSlot(
      hit({ chapterId: 'chA', source: 'import', text: 'i', updatedAt: 100 }),
      hit({ chapterId: 'chA', source: 'live', text: 'l', updatedAt: 100, path: '3' }),
    );
    assert.equal(merged.source, 'live');
    assert.equal(merged.text, 'l');
    assert.equal(merged.id, withSlotId(hit({ chapterId: 'chA' })).id);
  });
});
