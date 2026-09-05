import test from 'node:test';
import assert from 'node:assert/strict';
import { predictionStops, predictionPosition, predictionValue, adjustPrediction, snapPrediction } from './prediction-scale.mjs';

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
test('controls clamp bounds and move smoothly by hundredths', () => {
 assert.equal(predictionPosition(0.73), 0);
 assert.equal(predictionValue(-10), 1.5);
 assert.equal(predictionValue(1200), 39);
 assert.equal(adjustPrediction(2.50, 1), 2.51);
 assert.equal(adjustPrediction(2.50, -1), 2.49);
 assert.equal(adjustPrediction(1.5, -1), 1.5);
 assert.equal(adjustPrediction(39, 1), 39);
 assert.equal(adjustPrediction(NaN, 1), 1.51);
 assert.equal(snapPrediction(5.794), 5.79);
 assert.equal(snapPrediction(17.436), 17.44);
});
