export const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];

export const FACE_COLORS = {
  U: 0xf8f7ef,
  D: 0xf8d43a,
  L: 0xff8a25,
  R: 0xd92e2e,
  F: 0x1e9b56,
  B: 0x2367d8
};

export const FACE_NAMES = {
  U: 'Up',
  D: 'Down',
  L: 'Left',
  R: 'Right',
  F: 'Front',
  B: 'Back'
};

export const MOVE_DEFS = {
  U: { axis: 'y', layer: 1, normal: 1 },
  D: { axis: 'y', layer: -1, normal: -1 },
  R: { axis: 'x', layer: 1, normal: 1 },
  L: { axis: 'x', layer: -1, normal: -1 },
  F: { axis: 'z', layer: 1, normal: 1 },
  B: { axis: 'z', layer: -1, normal: -1 }
};

export const AXIS_INDEX = { x: 0, y: 1, z: 2 };

export const ALGORITHMS = {
  novice: [
    { label: 'Right hand trigger', notation: "R U R' U'", note: 'Corner and edge practice' },
    { label: 'Left hand trigger', notation: "L' U' L U", note: 'Mirror trigger' },
    { label: 'Beginner insert', notation: "U R U' R'", note: 'Simple top-layer insertion' }
  ],
  intermediate: [
    { label: 'Sune OLL', notation: "R U R' U R U2 R'", note: 'Common orientation trigger' },
    { label: 'Anti-sune OLL', notation: "R U2 R' U' R U' R'", note: 'Mirror orientation trigger' },
    { label: 'F2L trigger pair', notation: "U R U' R' U' F' U F", note: 'Useful pairing pattern' }
  ],
  expert: [
    { label: 'T-perm PLL', notation: "R U R' U' R' F R2 U' R' U' R U R' F'", note: 'Adjacent corner swap case' },
    { label: 'J-perm PLL', notation: "R U R' F' R U R' U' R' F R2 U' R'", note: 'Fast last-layer permutation' },
    { label: 'Y-perm PLL', notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'", note: 'Face-turn-only permutation algorithm' }
  ]
};

export function parseMoves(input) {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => normalizeMove(token))
    .filter(Boolean);
}

export function normalizeMove(token) {
  const clean = token.trim();
  const match = /^([UDLRFB])([2']?)$/.exec(clean);
  if (!match) return null;
  return match[1] + match[2];
}

export function moveAmount(move) {
  if (move.endsWith('2')) return 2;
  if (move.endsWith("'")) return -1;
  return 1;
}

export function moveQuarterAngle(move) {
  const face = move[0];
  const def = MOVE_DEFS[face];
  return -def.normal * moveAmount(move) * Math.PI / 2;
}

export function inverseMove(move) {
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return move[0];
  return `${move}'`;
}

export function inverseSequence(sequence) {
  return [...sequence].reverse().map(inverseMove);
}

export function makeScramble(length = 24) {
  const moves = [];
  let previousFace = null;
  let previousAxis = null;
  const modifiers = ['', "'", '2'];
  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    const axis = MOVE_DEFS[face].axis;
    if (face === previousFace || axis === previousAxis && Math.random() < 0.5) continue;
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    moves.push(`${face}${modifier}`);
    previousFace = face;
    previousAxis = axis;
  }
  return moves;
}

export const DAISY_SEQUENCE = parseMoves("F2 R2 B2 L2");
export const WHITE_CROSS_SEQUENCE = parseMoves("U2");

export function rotateVectorArray(values, axis, angle) {
  const [x, y, z] = values;
  const sign = Math.sign(angle);
  if (axis === 'x') return sign > 0 ? [x, -z, y] : [x, z, -y];
  if (axis === 'y') return sign > 0 ? [z, y, -x] : [-z, y, x];
  return sign > 0 ? [-y, x, z] : [y, -x, z];
}

export function axisValue(position, axis) {
  return Math.round(position[AXIS_INDEX[axis]]);
}

export function snap(value) {
  return Math.round(value);
}
