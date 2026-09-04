function validMultiplier(multiplier) {
  const value = Number(multiplier);
  if (!Number.isFinite(value) || value < 1) throw new RangeError('Invalid audio multiplier');
  return value;
}

export function audioStage(multiplier) {
  const value = validMultiplier(multiplier);
  if (value >= 25) return 4;
  if (value >= 7) return 3;
  if (value >= 3) return 2;
  if (value >= 1.5) return 1;
  return 0;
}

export function growthCue(multiplier, tick = 0) {
  const value = validMultiplier(multiplier);
  const energy = Math.min(1, Math.log2(value) / Math.log2(100));
  const semitone = Math.floor(energy * 20);
  return {
    intervalMs: Math.round(78 - energy * 52),
    frequency: 560 * 2 ** (semitone / 12),
    volume: .021 + energy * .011,
    accent: tick % 4 === 3,
  };
}

export function landingCue(index, multiplier) {
  const stage = audioStage(multiplier);
  return {
    bodyFrequency: 138 + stage * 14 + (index % 3) * 7,
    crystalFrequency: 430 + stage * 74 + (index % 5) * 18,
    volume: .032 + stage * .003,
  };
}

const CHORDS = [
  [50, 57, 60, 64],
  [48, 55, 59, 62],
  [45, 52, 55, 59],
  [43, 50, 57, 60],
];
const ARPEGGIO = [0, 2, 1, 3, 1, 2, 0, 3];

export function musicEvent(step, multiplier) {
  if (!Number.isInteger(step) || step < 0) throw new RangeError('Invalid music step');
  const stage = audioStage(multiplier);
  const bpm = 94 + stage * 12;
  const beat = step % 8;
  const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
  return {
    stage,
    stepSeconds: 30 / bpm,
    chord,
    arpMidi: chord[ARPEGGIO[beat]] + 12 + (stage >= 3 && beat % 2 ? 12 : 0),
    pad: beat === 0,
    bass: beat % 2 === 0,
    kick: beat % 4 === 0,
    sparkle: stage >= 2 && beat % 2 === 1,
  };
}
