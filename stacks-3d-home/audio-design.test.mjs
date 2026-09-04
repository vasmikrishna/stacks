import test from 'node:test';
import assert from 'node:assert/strict';
import { audioStage, growthCue, landingCue, musicEvent } from './audio-design.mjs';

test('money cadence accelerates sharply as the multiplier grows', () => {
  const cues = [1, 2, 7, 25, 100].map((value) => growthCue(value));
  assert.ok(cues.every((cue, index) => index === 0 || cue.intervalMs < cues[index - 1].intervalMs));
  assert.ok(cues[0].intervalMs <= 80);
  assert.ok(cues.at(-1).intervalMs <= 30);
  assert.ok(cues.at(-1).frequency > cues[0].frequency * 2);
  assert.equal(growthCue(3, 3).accent, true);
});

test('landing sounds vary by block and bonus stage', () => {
  const base = landingCue(0, 1.1);
  const adjacent = landingCue(1, 1.1);
  const legendary = landingCue(0, 25);
  assert.notEqual(base.bodyFrequency, adjacent.bodyFrequency);
  assert.ok(legendary.crystalFrequency > base.crystalFrequency);
  assert.ok(legendary.volume > base.volume);
});

test('background arrangement gains tempo and layers at bonus milestones', () => {
  assert.deepEqual([1, 1.5, 3, 7, 25].map(audioStage), [0, 1, 2, 3, 4]);
  const opening = musicEvent(0, 1);
  const high = musicEvent(1, 25);
  assert.equal(opening.pad, true);
  assert.equal(opening.kick, true);
  assert.equal(high.sparkle, true);
  assert.ok(high.stepSeconds < opening.stepSeconds);
});
