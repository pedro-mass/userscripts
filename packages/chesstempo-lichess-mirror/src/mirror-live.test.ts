import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LICHESS_HEARTBEAT_TTL_MS } from './sync';

test('heartbeat TTL is reasonable for UI polling', () => {
  assert.ok(LICHESS_HEARTBEAT_TTL_MS >= 5000);
  assert.ok(LICHESS_HEARTBEAT_TTL_MS <= 15_000);
});
