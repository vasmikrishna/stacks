import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplaySnapshot, seededUnit } from './replay.mjs';

test('seeded visual values are stable and bounded', () => {
  const first = Array.from({ length: 9 }, (_, index) => seededUnit(123456, index, index % 3));
  const repeated = Array.from({ length: 9 }, (_, index) => seededUnit(123456, index, index % 3));
  assert.deepEqual(repeated, first);
  assert.ok(first.every((value) => value >= 0 && value < 1));
  assert.notDeepEqual(first, Array.from({ length: 9 }, (_, index) => seededUnit(123457, index, index % 3)));
});

test('replay snapshots preserve the complete historical round', () => {
  const source = {
    roundId: 7,
    betCents: 12500,
    targetUnits: 350,
    resultUnits: 421,
    payoutCents: 43750,
    won: true,
    visualSeed: 912345,
    turbo: true,
    bonusTransitions: [{ level: 1, atUnits: 151 }, { level: 2, atUnits: 302 }],
  };
  const snapshot = createReplaySnapshot(source);
  source.bonusTransitions[0].atUnits = 999;
  assert.deepEqual(snapshot, {
    version: 1,
    roundId: 7,
    betCents: 12500,
    targetUnits: 350,
    resultUnits: 421,
    payoutCents: 43750,
    won: true,
    visualSeed: 912345,
    turbo: true,
    bonusTransitions: [{ level: 1, atUnits: 151 }, { level: 2, atUnits: 302 }],
  });
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.bonusTransitions));
});

test('replay snapshots reject incomplete financial data', () => {
  assert.throws(() => createReplaySnapshot({ roundId: 1 }), /Invalid bet/);
});
