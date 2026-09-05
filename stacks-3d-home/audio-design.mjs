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

export function growthCue(multiplier) {
  const value = validMultiplier(multiplier);
  const energy = Math.min(1, Math.log2(value) / Math.log2(100));
  return {
    playbackRate: .92 + energy * .48,
    volume: .1 + energy * .06,
  };
}

export function landingCue(index, multiplier) {
  const stage = audioStage(multiplier);
  return {
    playbackRate: .93 + stage * .045 + (index % 3) * .025,
    volume: .15 + stage * .015,
  };
}
