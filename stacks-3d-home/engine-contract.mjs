export const SAMPLE_COUNT = 4294967296n;
export const MIN_TARGET = 101;
export const MAX_TARGET = 100000;
export const MAX_REVEAL_UNITS = 3900;
export const SUPPORTED_TARGETS = Object.freeze([
  150, 200, 250, 300, 500, 700, 1000, 2500, 3900,
]);
export const SECOND_CHANCE_COST = 2;
export const SECOND_CHANCE_PAYOUTS = Object.freeze(Object.fromEntries(SUPPORTED_TARGETS.map(target => {
  const singleChance = 96.5 / target;
  const twoChanceProbability = 1 - (1 - singleChance) ** 2;
  return [target, Math.round(193 / twoChanceProbability)];
})));

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

export function secondChanceMode(units) {
  if (!Number.isInteger(units) || !SUPPORTED_TARGETS.includes(units)) throw new RangeError('Select a supported prediction.');
  return `second_chance_${units}`;
}

export function modeDetails(mode) {
  const match = /^(target|second_chance)_(\d+)$/.exec(mode);
  const targetUnits = Number(match?.[2]);
  if (!match || String(targetUnits) !== match[2] || !SUPPORTED_TARGETS.includes(targetUnits)) throw new RangeError('Invalid mode');
  const secondChance = match[1] === 'second_chance';
  return { targetUnits, secondChance, cost: secondChance ? SECOND_CHANCE_COST : 1 };
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
export function modeBooks(targetUnits) {
  targetMode(targetUnits);
  const cuts = new Set([0n, SAMPLE_COUNT, samplesAtLeast(targetUnits)]);
  for (const units of [100, 150, 300, 700, 2500, MAX_REVEAL_UNITS]) cuts.add(samplesAtLeast(units));
  for (let part = 1n; part < 32n; part++) cuts.add(SAMPLE_COUNT * part / 32n);
  const sorted = [...cuts].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return sorted.slice(1).map((upper, id) => {
    const lower = sorted[id];
    const sample = lower + 1n + (upper - lower - 1n) / 2n;
    const units = Number(965n * SAMPLE_COUNT / (10n * sample));
    const resultUnits = Math.min(MAX_REVEAL_UNITS, units);
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

export function secondChanceBooks(targetUnits) {
  secondChanceMode(targetUnits);
  const payoutMultiplier = SECOND_CHANCE_PAYOUTS[targetUnits];
  const winWeight = 193n * SAMPLE_COUNT / BigInt(payoutMultiplier);
  const firstWinWeight = samplesAtLeast(targetUnits);
  const secondWinWeight = winWeight - firstWinWeight;
  const lossWeight = SAMPLE_COUNT - winWeight;
  if (secondWinWeight <= 0n || lossWeight <= 0n || payoutMultiplier >= 4000) throw new Error('Invalid Second Chance distribution');
  const losingResult = Math.max(96, targetUnits - 1);
  return [
    { weight: firstWinWeight, book: { id: 0, payoutMultiplier, events: [
      { index: 0, type: 'stacksSecondChance', targetUnits, attempts: [targetUnits], visualSeed: 101 + targetUnits },
      { index: 1, type: 'finalWin', amount: payoutMultiplier },
    ] } },
    { weight: secondWinWeight, book: { id: 1, payoutMultiplier, events: [
      { index: 0, type: 'stacksSecondChance', targetUnits, attempts: [losingResult, targetUnits], visualSeed: 202 + targetUnits },
      { index: 1, type: 'finalWin', amount: payoutMultiplier },
    ] } },
    { weight: lossWeight, book: { id: 2, payoutMultiplier: 0, events: [
      { index: 0, type: 'stacksSecondChance', targetUnits, attempts: [losingResult, Math.max(96, losingResult - 1)], visualSeed: 303 + targetUnits },
      { index: 1, type: 'finalWin', amount: 0 },
    ] } },
  ];
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
  const reveal = events.find(event => event.type === (details.secondChance ? 'stacksSecondChance' : 'stacksReveal'));
  const final = events.find(event => event.type === 'finalWin');
  const targetUnits = details.targetUnits;
  if (!reveal || reveal.targetUnits !== targetUnits || !Number.isInteger(reveal.visualSeed) || reveal.visualSeed < 0 || reveal.visualSeed > 0xffffffff) throw new Error('The server outcome does not match this target.');
  const attempts = details.secondChance ? reveal.attempts : [reveal.resultUnits];
  if (!Array.isArray(attempts) || attempts.length < 1 || attempts.length > (details.secondChance ? 2 : 1) || attempts.some(result => !Number.isInteger(result) || result < 96 || result > MAX_TARGET)) throw new Error('The server outcome contains invalid attempts.');
  const won = attempts.some(result => result >= targetUnits);
  const payoutUnits = won ? (details.secondChance ? SECOND_CHANCE_PAYOUTS[targetUnits] : targetUnits) : 0;
  if (final?.amount !== payoutUnits) throw new Error('The server payout does not match the outcome.');
  return { ...reveal, resultUnits: attempts.at(-1), attempts, payoutUnits, secondChance: details.secondChance, cost: details.cost };
}
