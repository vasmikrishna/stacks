export const GAME_MODES = Object.freeze([
  Object.freeze({ id: 'classic', label: 'Classic', boost: 1, colors: [0x11bce3, 0x6659ef], background: 0x080c12 }),
  Object.freeze({ id: 'prism', label: 'Prism', boost: 2, colors: [0x43edbd, 0xf48fb1], background: 0x080e10 }),
  Object.freeze({ id: 'tesseract', label: 'Tesseract', boost: 3, colors: [0x879aff, 0xf589db], background: 0x0a0c13 }),
  Object.freeze({ id: 'reactor', label: 'Reactor', boost: 5, colors: [0xc8f65c, 0xe8edf1], background: 0x0b0e10 }),
]);

export function gameMode(id = 'classic') {
  const mode = GAME_MODES.find(mode => mode.id === id);
  if (!mode) throw new RangeError('Unknown game mode.');
  return mode;
}

export function boostedPayoutUnits(targetUnits, modeId = 'classic') {
  if (!Number.isInteger(targetUnits) || targetUnits < 150 || targetUnits > 3900) throw new RangeError('Invalid prediction.');
  return targetUnits * gameMode(modeId).boost;
}

// The same transform drives demo reveals and the weighted Engine event books.
export function modeRevealUnits(word, modeId = 'classic') {
  if (!Number.isInteger(word) || word < 0 || word > 0xffffffff) throw new RangeError('Invalid random sample.');
  const units = Number(965n * 4294967296n / (10n * BigInt(word + 1) * BigInt(gameMode(modeId).boost)));
  return Math.max(96, Math.min(3900, units));
}
