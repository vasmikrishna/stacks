function integer(value, name, minimum, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`Invalid ${name}`);
  }
  return value;
}

export function seededUnit(seed, index, channel = 0) {
  let value = integer(seed, 'visual seed', 0, 0xffffffff) >>> 0;
  value ^= Math.imul(integer(index, 'visual index', 0) + 1, 0x9e3779b1);
  value ^= Math.imul(integer(channel, 'visual channel', 0) + 1, 0x85ebca6b);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

export function createReplaySnapshot(round) {
  const snapshot = {
    version: 1,
    roundId: integer(round.roundId, 'round id', 1),
    betCents: integer(round.betCents, 'bet', 100),
    targetUnits: integer(round.targetUnits, 'target', 101, 100000),
    resultUnits: integer(round.resultUnits, 'result', 0, 100000),
    payoutCents: integer(round.payoutCents, 'payout', 0),
    won: Boolean(round.won),
    visualSeed: integer(round.visualSeed, 'visual seed', 0, 0xffffffff),
    turbo: Boolean(round.turbo),
    bonusTransitions: Object.freeze((round.bonusTransitions || []).map((transition) => Object.freeze({
      level: integer(transition.level, 'bonus level', 1, 4),
      atUnits: integer(transition.atUnits, 'bonus multiplier', 100, 100000),
    }))),
  };
  return Object.freeze(snapshot);
}
