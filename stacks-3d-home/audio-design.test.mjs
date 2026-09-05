import test from 'node:test';
import assert from 'node:assert/strict';
import { audioStage, growthCue, landingCue } from './audio-design.mjs';

test('multiplier count accelerates and gains energy as the multiplier grows', () => {
  const cues = [1, 2, 7, 25, 100].map((value) => growthCue(value));
  assert.ok(cues.every((cue, index) => index === 0 || cue.playbackRate > cues[index - 1].playbackRate));
  assert.ok(cues[0].playbackRate >= .9 && cues[0].playbackRate <= .95);
  assert.ok(cues.at(-1).playbackRate >= 1.35 && cues.at(-1).playbackRate <= 1.45);
  assert.ok(cues.at(-1).volume > cues[0].volume);
});

test('landing sounds vary by block and bonus stage', () => {
  assert.deepEqual([1, 1.5, 3, 7, 25].map(audioStage), [0, 1, 2, 3, 4]);
  const base = landingCue(0, 1.1);
  const adjacent = landingCue(1, 1.1);
  const legendary = landingCue(0, 25);
  assert.notEqual(base.playbackRate, adjacent.playbackRate);
  assert.ok(legendary.playbackRate > base.playbackRate);
  assert.ok(legendary.volume > base.volume);
});
