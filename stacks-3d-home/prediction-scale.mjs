// UI calibration only; the round distribution and payouts are independent of this scale.
export const predictionStops = [[1.01, 0], [2, 160], [5, 350], [10, 460], [25, 640], [100, 790], [1000, 1000]];

export function predictionPosition(value) {
 const clamped = Math.min(1000, Math.max(1.01, value));
 for (let i = 1; i < predictionStops.length; i++) {
  const [low, start] = predictionStops[i - 1], [high, end] = predictionStops[i];
  if (clamped <= high) return start + Math.log(clamped / low) / Math.log(high / low) * (end - start);
 }
 return 1000;
}

export function predictionValue(position) {
 const clamped = Math.min(1000, Math.max(0, position));
 for (let i = 1; i < predictionStops.length; i++) {
  const [low, start] = predictionStops[i - 1], [high, end] = predictionStops[i];
  if (clamped <= end) return low * (high / low) ** ((clamped - start) / (end - start));
 }
 return 1000;
}

export function adjustPrediction(value, direction) {
 const current = Number.isFinite(value) ? value : 1.01;
 return Math.min(1000, Math.max(1.01, (Math.round(current * 100) + direction) / 100));
}
