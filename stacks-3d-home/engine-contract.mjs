import { gameMode, boostedPayoutUnits, modeRevealUnits } from './game-modes.mjs';
export const SAMPLE_COUNT = 4294967296n;
export const MIN_TARGET = 101;
export const MAX_TARGET = 100000;
export const MAX_REVEAL_UNITS = 3900;
export const SUPPORTED_TARGETS = Object.freeze([
  150, 200, 250, 300, 500, 700, 1000, 2500, 3900,
]);

export function nearestTarget(units) {
  if (!Number.isFinite(units)) throw new RangeError('Invalid target');
  let best = SUPPORTED_TARGETS[0];
  for (const target of SUPPORTED_TARGETS) {
    if (Math.abs(target - units) < Math.abs(best - units)) best = target;
  }
  return best;
}

export function targetMode(units, modeId = 'classic') {
  if (!Number.isInteger(units) || !SUPPORTED_TARGETS.includes(units)) throw new RangeError('Select a supported prediction.');
  gameMode(modeId);
  return modeId === 'classic' ? `target_${units}` : `${modeId}_target_${units}`;
}

export function modeDetails(mode) {
  const match = /^(?:(prism|tesseract|reactor)_)?target_(\d+)$/.exec(mode);
  const targetUnits = Number(match?.[2]);
  if (!match || String(targetUnits) !== match[2] || !SUPPORTED_TARGETS.includes(targetUnits)) throw new RangeError('Invalid mode');
  const modeId = match[1] || 'classic';
  return { targetUnits, modeId, boost: gameMode(modeId).boost, cost: 1 };
}

export function modeCost(mode) {
  return modeDetails(mode).cost;
}

export function modeTarget(mode) {
  return modeDetails(mode).targetUnits;
}

export function samplesAtLeast(units) {
  if (!Number.isInteger(units) || units <= 0) throw new RangeError('Invalid threshold');
  const count = 965n * SAMPLE_COUNT / (10n * BigInt(units));
  return count > SAMPLE_COUNT ? SAMPLE_COUNT : count;
}

// Split entropy at all financially/visually significant thresholds. Midpoint
// reveals approximate the numeric distribution without changing target odds.
export function modeBooks(targetUnits, modeId = 'classic') {
  targetMode(targetUnits, modeId);
  const { boost } = gameMode(modeId);
  const payoutUnits = boostedPayoutUnits(targetUnits, modeId);
  const cuts = new Set([0n, SAMPLE_COUNT, samplesAtLeast(payoutUnits)]);
  for (const units of [100, 150, 300, 700, 2500, MAX_REVEAL_UNITS]) cuts.add(samplesAtLeast(units * boost));
  for (let part = 1n; part < 32n; part++) cuts.add(SAMPLE_COUNT * part / 32n);
  const sorted = [...cuts].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return sorted.slice(1).map((upper, id) => {
    const lower = sorted[id];
    const sample = lower + 1n + (upper - lower - 1n) / 2n;
    const resultUnits = modeRevealUnits(Number(sample - 1n), modeId);
    const payoutMultiplier = resultUnits >= targetUnits ? payoutUnits : 0;
    return {
      weight: upper - lower,
      book: {
        id,
        payoutMultiplier,
        events: [
          { index: 0, type: 'stacksReveal', modeId, boost, targetUnits, resultUnits, visualSeed: Number(sample - 1n) },
          { index: 1, type: 'finalWin', amount: payoutMultiplier },
        ],
      },
    };
  });
}

export function apiAmount(text) {
  const match = /^(\d+)(?:\.(\d{0,6}))?$/.exec(String(text).trim());
  if (!match) throw new RangeError('Enter an amount with up to six decimal places.');
  const amount = BigInt(match[1]) * 1000000n + BigInt((match[2] || '').padEnd(6, '0'));
  if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Invalid play amount.');
  return Number(amount);
}

export function amountText(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('Invalid wallet amount.');
  const whole = Math.floor(amount / 1000000);
  const fraction = String(amount % 1000000).padStart(6, '0').replace(/0+$/, '');
  return `${whole}${fraction ? '.' + fraction : ''}`;
}

export function decodeOutcome(state, mode) {
  const events = Array.isArray(state) ? state : state?.events;
  if (!Array.isArray(events)) throw new Error('The server returned no STACKS outcome.');
  const details = modeDetails(mode);
  const reveal = events.find(event => event.type === 'stacksReveal');
  const final = events.find(event => event.type === 'finalWin');
  const targetUnits = details.targetUnits;
  if (!reveal || reveal.targetUnits !== targetUnits || !Number.isInteger(reveal.visualSeed) || reveal.visualSeed < 0 || reveal.visualSeed > 0xffffffff) throw new Error('The server outcome does not match this target.');
  if ((reveal.modeId ?? 'classic') !== details.modeId || (reveal.boost ?? 1) !== details.boost) throw new Error('The server outcome does not match this game mode.');
  if (!Number.isInteger(reveal.resultUnits) || reveal.resultUnits < 96 || reveal.resultUnits > MAX_TARGET) throw new Error('The server outcome contains an invalid result.');
  const won = reveal.resultUnits >= targetUnits;
  const payoutUnits = won ? boostedPayoutUnits(targetUnits, details.modeId) : 0;
  if (final?.amount !== payoutUnits) throw new Error('The server payout does not match the outcome.');
  return { ...reveal, payoutUnits, modeId: details.modeId, boost: details.boost, cost: 1 };
}
