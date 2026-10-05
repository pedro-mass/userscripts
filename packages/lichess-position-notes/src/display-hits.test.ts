import assert from 'node:assert/strict';
import test from 'node:test';
import type { PositionNoteHit } from './types';
import {
  dedupeNewestPerChapter,
  hitsForDisplay,
  isCurrentChapterNote,
} from './display-hits';

function hit(
  partial: Partial<PositionNoteHit> & Pick<PositionNoteHit, 'id'>,
): PositionNoteHit {
  return {
    positionKey: 'k',
    fenFull: 'fen',
    text: 't',
    studyId: 'study1',
    studyName: 'S',
    chapterId: 'chA',
    chapterName: 'A',
    path: 'p',
    ply: 1,
    san: 'e4',
    uciTrail: [],
    onMainline: true,
    chapterUrl: 'https://lichess.org/study/study1/chA',
    positionUrl: 'https://lichess.org/study/study1/chA#1',
    source: 'live',
    importedAt: 0,
    updatedAt: 0,
    ...partial,
  };
}

test('isCurrentChapterNote matches study and chapter', () => {
  const h = hit({ id: '1' });
  assert.equal(isCurrentChapterNote(h, 'study1', 'chA'), true);
  assert.equal(isCurrentChapterNote(h, 'study1', 'chB'), false);
  assert.equal(isCurrentChapterNote(h, 'other', 'chA'), false);
});

test('dedupeNewestPerChapter keeps newest per chapter', () => {
  const rows = dedupeNewestPerChapter([
    hit({ id: '1', chapterId: 'chA', updatedAt: 10, text: 'old' }),
    hit({ id: '2', chapterId: 'chA', updatedAt: 20, text: 'new' }),
    hit({ id: '3', chapterId: 'chB', updatedAt: 5, text: 'b' }),
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.chapterId === 'chA')?.text, 'new');
});

test('hitsForDisplay drops current chapter and dedupes', () => {
  const visible = hitsForDisplay(
    [
      hit({ id: '1', chapterId: 'chA', updatedAt: 10 }),
      hit({ id: '2', chapterId: 'chB', updatedAt: 20 }),
      hit({ id: '3', chapterId: 'chB', updatedAt: 30 }),
    ],
    'study1',
    'chA',
  );
  assert.equal(visible.length, 1);
  assert.equal(visible[0].chapterId, 'chB');
  assert.equal(visible[0].updatedAt, 30);
});
