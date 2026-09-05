export const SAMPLE_COUNT = 4294967296n;
export const MIN_TARGET = 101;
export const MAX_TARGET = 100000;
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

export function targetMode(units) {
  if (!Number.isInteger(units) || !SUPPORTED_TARGETS.includes(units)) throw new RangeError('Select a supported prediction.');
  return `target_${units}`;
}

export function modeTarget(mode) {
  const units = Number(/^target_(\d+)$/.exec(mode)?.[1]);
  if (targetMode(units) !== mode) throw new RangeError('Invalid mode');
  return units;
}

export function samplesAtLeast(units) {
  if (!Number.isInteger(units) || units <= 0) throw new RangeError('Invalid threshold');
  const count = 965n * SAMPLE_COUNT / (10n * BigInt(units));
  return count > SAMPLE_COUNT ? SAMPLE_COUNT : count;
}

// Split entropy at all financially/visually significant thresholds. Midpoint
// reveals approximate the numeric distribution without changing target odds.
export function modeBooks(targetUnits) {
  targetMode(targetUnits);
  const cuts = new Set([0n, SAMPLE_COUNT, samplesAtLeast(targetUnits)]);
  for (const units of [100, 150, 300, 700, 2500, MAX_TARGET]) cuts.add(samplesAtLeast(units));
  for (let part = 1n; part < 32n; part++) cuts.add(SAMPLE_COUNT * part / 32n);
  const sorted = [...cuts].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return sorted.slice(1).map((upper, id) => {
    const lower = sorted[id];
    const sample = lower + 1n + (upper - lower - 1n) / 2n;
    const units = Number(965n * SAMPLE_COUNT / (10n * sample));
    const resultUnits = Math.min(MAX_TARGET, units);
    const payoutMultiplier = resultUnits >= targetUnits ? targetUnits : 0;
    return {
      weight: upper - lower,
      book: {
        id,
        payoutMultiplier,
        events: [
          { index: 0, type: 'stacksReveal', targetUnits, resultUnits, visualSeed: Number(sample - 1n) },
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
  const reveal = events.find(event => event.type === 'stacksReveal');
  const final = events.find(event => event.type === 'finalWin');
  const targetUnits = modeTarget(mode);
  if (!reveal || reveal.targetUnits !== targetUnits || !Number.isInteger(reveal.resultUnits) || reveal.resultUnits < 96 || reveal.resultUnits > MAX_TARGET || !Number.isInteger(reveal.visualSeed) || reveal.visualSeed < 0 || reveal.visualSeed > 0xffffffff) throw new Error('The server outcome does not match this target.');
  const payoutUnits = reveal.resultUnits >= targetUnits ? targetUnits : 0;
  if (final?.amount !== payoutUnits) throw new Error('The server payout does not match the outcome.');
  return { ...reveal, payoutUnits };
}
