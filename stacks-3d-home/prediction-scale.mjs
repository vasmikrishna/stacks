// UI calibration only; the round distribution and payouts are independent of this scale.
export const predictionStops = [[1.5, 0], [2, 130], [5, 450], [10, 670], [25, 920], [39, 1000]];

export function predictionPosition(value) {
 const clamped = Math.min(39, Math.max(1.5, value));
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
 return 39;
}

export function adjustPrediction(value, direction) {
 const units=Math.round((Number.isFinite(value)?value:1.5)*100)+direction;
 return Math.min(3900,Math.max(150,units))/100;
}

export function snapPrediction(value) {
 return Math.min(3900,Math.max(150,Math.round(Number(value)*100)))/100;
}
