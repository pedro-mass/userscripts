import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bottomColorFromBoardElement } from './ct-fen';

function mockBoard(attrs: Record<string, string>, classes: string[] = []) {
  return {
    classList: { contains: (c: string) => classes.includes(c) },
    getAttribute: (name: string) => attrs[name] ?? null,
    hasAttribute: (name: string) => name in attrs,
  };
}

test('bottomColorFromBoardElement: flipped attribute true', () => {
  assert.equal(
    bottomColorFromBoardElement(mockBoard({ flipped: 'true' })),
    'black',
  );
});

test('bottomColorFromBoardElement: flipped class', () => {
  assert.equal(bottomColorFromBoardElement(mockBoard({}, ['flipped'])), 'black');
});

test('bottomColorFromBoardElement: default white', () => {
  assert.equal(
    bottomColorFromBoardElement(mockBoard({}, ['ct-ot-chess-board'])),
    'white',
  );
});
