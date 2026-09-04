export const RTP = 0.965;
export const MAX_MULTIPLIER = 1000;
const SAMPLE_COUNT = 2 ** 32;

export const BONUS_STAGES = [
  { level: 0, threshold: 1, label: 'Stacking', factor: 1 },
  { level: 1, threshold: 1.5, label: 'Stack Bonus', factor: 1.05 },
  { level: 2, threshold: 3, label: 'Double Stack', factor: 1.1 },
  { level: 3, threshold: 7, label: 'Super Stack', factor: 1.2 },
  { level: 4, threshold: 25, label: 'Legendary Stack', factor: 1.5 },
];

// A round consumes one uniform 32-bit sample. Keep the crash point unrounded:
// truncating it before settlement would introduce an extra, target-dependent edge.
export function crashPoint(word) {
  if (!Number.isInteger(word) || word < 0 || word >= SAMPLE_COUNT) throw new RangeError('Invalid random sample');
  return RTP * SAMPLE_COUNT / (word + 1);
}

export function multiplierUnits(value) {
  return Math.floor(value * 100 + 1e-9);
}

export function payout(stakeCents, units) {
  if (!Number.isSafeInteger(stakeCents) || stakeCents < 0 || !Number.isInteger(units) || units < 100 || units > 100000) throw new RangeError('Invalid payout');
  const result = BigInt(stakeCents) * BigInt(units) / 100n;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Payout overflow');
  return Number(result);
}

export function bonusStage(value) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid multiplier');
  for (let index = BONUS_STAGES.length - 1; index >= 0; index -= 1) {
    if (value >= BONUS_STAGES[index].threshold) return BONUS_STAGES[index];
  }
  return BONUS_STAGES[0];
}

export function effectiveMultiplierUnits(value, factors = []) {
  const rawUnits = multiplierUnits(value);
  if (rawUnits < 100 || rawUnits > 100000) throw new RangeError('Invalid multiplier');
  const factor = factors.reduce((total, item) => {
    const amount = typeof item === 'number' ? item : item?.factor;
    if (!Number.isFinite(amount) || amount <= 0) throw new RangeError('Invalid multiplier factor');
    return total * amount;
  }, 1);
  return Math.min(multiplierUnits((rawUnits / 100) * factor), MAX_MULTIPLIER * 100);
}

export function winProbability(units) {
  if (!Number.isInteger(units) || units < 100 || units > 100000) throw new RangeError('Invalid multiplier');
  return Number(965n * BigInt(SAMPLE_COUNT) / (10n * BigInt(units))) / SAMPLE_COUNT;
}

// Reveal the full outcome before settling; a prediction wins an exact tie.
export function resolveRound(current, crash, target) {
  const result = Math.min(crash, MAX_MULTIPLIER);
  if (current >= result) return { won: result >= target, at: result };
  return null;
}
