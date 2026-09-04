import test from 'node:test';
import assert from 'node:assert/strict';
import { predictionStops, predictionPosition, predictionValue, adjustPrediction } from './prediction-scale.mjs';

test('ruler stops line up with both target and live value', () => {
 for (const [value, position] of predictionStops) {
  assert.ok(Math.abs(predictionPosition(value) - position) < 1e-9);
  assert.ok(Math.abs(predictionValue(position) - value) < 1e-9);
 }
});
test('scale is monotonic and invertible across the full track', () => {
 let previous = 0;
 for (let position = 0; position <= 1000; position++) {
  const value = predictionValue(position);
  assert.ok(value > previous);
  assert.ok(Math.abs(predictionPosition(value) - position) < 1e-8);
  previous = value;
 }
});
test('controls clamp bounds and preserve cent-sized multiplier increments', () => {
 assert.equal(predictionPosition(0.73), 0);
 assert.equal(predictionValue(-10), 1.01);
 assert.equal(predictionValue(1200), 1000);
 assert.equal(adjustPrediction(2.50, 1), 2.51);
 assert.equal(adjustPrediction(2.50, -1), 2.49);
 assert.equal(adjustPrediction(1.01, -1), 1.01);
 assert.equal(adjustPrediction(1000, 1), 1000);
 assert.equal(adjustPrediction(NaN, 1), 1.02);
});
