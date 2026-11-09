// QR encoder — the main way a Magic Card is read now. Byte mode, error
// correction level M, versions 1–6, which is far more than a card number
// needs. Everything is written out here (no library, no webfont) so the code
// stays sharp on a printed card and carries the number exactly as stored,
// leading zeros included.

const VERSIONS = {
  1: { blocks: 1, total: 26, data: 16 },
  2: { blocks: 1, total: 44, data: 28 },
  3: { blocks: 1, total: 70, data: 44 },
  4: { blocks: 2, total: 50, data: 32 },
  5: { blocks: 2, total: 67, data: 43 },
  6: { blocks: 4, total: 43, data: 27 },
};

// Alignment pattern centres, in module coordinates.
const ALIGNMENT = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };

const MAX_VERSION = 6;

// Level M in the format information bits (L=1, M=0, Q=3, H=2).
const EC_M = 0;

// GF(256) tables, primitive polynomial 0x11d.
const EXP = new Array(512);
const LOG = new Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}

const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

// Polynomials are kept highest-degree first.
const polyMul = (a, b) => {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) out[i + j] ^= gfMul(a[i], b[j]);
  }
  return out;
};

const generatorPoly = (ecCount) => {
  let gen = [1];
  for (let i = 0; i < ecCount; i += 1) gen = polyMul(gen, [1, EXP[i]]);
  return gen;
};

// Reed–Solomon error correction bytes for one block.
const ecBytes = (data, ecCount) => {
  const gen = generatorPoly(ecCount);
  const rem = new Array(ecCount).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ rem[0];
    rem.shift();
    rem.push(0);
    if (factor !== 0) {
      for (let i = 0; i < ecCount; i += 1) rem[i] ^= gfMul(gen[i + 1], factor);
    }
  });
  return rem;
};

const bitLength = (n) => {
  let len = 0;
  let v = n;
  while (v !== 0) {
    len += 1;
    v >>>= 1;
  }
  return len;
};

// The 15 format bits for this error correction level and mask.
const formatBits = (mask) => {
  const data = (EC_M << 3) | mask;
  let d = data << 10;
  while (bitLength(d) >= bitLength(0x537)) d ^= 0x537 << (bitLength(d) - bitLength(0x537));
  return ((data << 10) | d) ^ 0x5412;
};

const maskOn = (pattern, row, col) => {
  switch (pattern) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row * col) % 3) + ((row + col) % 2)) % 2 === 0;
  }
};

// Penalty score used only to choose the nicest of the eight masks.
const penalty = (modules) => {
  const size = modules.length;
  let score = 0;

  const scan = (get) => {
    let run = 1;
    for (let i = 1; i < size; i += 1) {
      if (get(i) === get(i - 1)) {
        run += 1;
      } else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) score += 3 + (run - 5);
  };

  for (let r = 0; r < size; r += 1) scan((i) => modules[r][i]);
  for (let c = 0; c < size; c += 1) scan((i) => modules[i][c]);

  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
    }
  }
  return score;
};

const pickVersion = (byteLength) => {
  for (let v = 1; v <= MAX_VERSION; v += 1) {
    const spec = VERSIONS[v];
    if (4 + 8 + byteLength * 8 <= spec.blocks * spec.data * 8) return v;
  }
  return MAX_VERSION;
};

const buildCodewords = (text, version) => {
  const spec = VERSIONS[version];
  const bytes = Array.from(new TextEncoder().encode(text));
  const capacity = spec.blocks * spec.data;

  const bits = [];
  const put = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };

  put(4, 4); // byte mode
  put(bytes.length, 8); // 8-bit character count, versions 1–9
  bytes.forEach((b) => put(b, 8));

  for (let i = 0; i < 4 && bits.length < capacity * 8; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }

  const pad = [0xec, 0x11];
  let p = 0;
  while (data.length < capacity) {
    data.push(pad[p % 2]);
    p += 1;
  }

  const dataBlocks = [];
  const ecBlocks = [];
  const ecPerBlock = spec.total - spec.data;
  for (let b = 0; b < spec.blocks; b += 1) {
    const chunk = data.slice(b * spec.data, (b + 1) * spec.data);
    dataBlocks.push(chunk);
    ecBlocks.push(ecBytes(chunk, ecPerBlock));
  }

  const out = [];
  for (let i = 0; i < spec.data; i += 1) {
    for (let b = 0; b < spec.blocks; b += 1) out.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < ecPerBlock; i += 1) {
    for (let b = 0; b < spec.blocks; b += 1) out.push(ecBlocks[b][i]);
  }
  return out;
};

const buildMatrix = (version, codewords, mask) => {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(null));

  const drawFinder = (row, col) => {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r < 0 || row + r >= size) continue;
      for (let c = -1; c <= 7; c += 1) {
        if (col + c < 0 || col + c >= size) continue;
        const dark =
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        modules[row + r][col + c] = dark;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Alignment patterns (version 1 has none).
  const centres = ALIGNMENT[version];
  centres.forEach((row) => {
    centres.forEach((col) => {
      if (modules[row][col] !== null) return;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          modules[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    });
  });

  // Timing patterns.
  for (let i = 8; i < size - 8; i += 1) {
    if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
    if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
  }

  // Format information, in both copies.
  const bits = formatBits(mask);
  for (let i = 0; i < 15; i += 1) {
    const dark = ((bits >> i) & 1) === 1;
    if (i < 6) modules[i][8] = dark;
    else if (i < 8) modules[i + 1][8] = dark;
    else modules[size - 15 + i][8] = dark;

    if (i < 8) modules[8][size - i - 1] = dark;
    else if (i < 9) modules[8][15 - i] = dark;
    else modules[8][14 - i] = dark;
  }
  modules[size - 8][8] = true;

  // Data, in the standard two-column zigzag.
  let bitIndex = 7;
  let byteIndex = 0;
  let row = size - 1;
  let dir = -1;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (;;) {
      for (let c = 0; c < 2; c += 1) {
        const target = col - c;
        if (modules[row][target] !== null) continue;
        let dark = false;
        if (byteIndex < codewords.length) dark = ((codewords[byteIndex] >>> bitIndex) & 1) === 1;
        if (maskOn(mask, row, target)) dark = !dark;
        modules[row][target] = dark;
        bitIndex -= 1;
        if (bitIndex < 0) {
          byteIndex += 1;
          bitIndex = 7;
        }
      }
      row += dir;
      if (row < 0 || row >= size) {
        row -= dir;
        dir = -dir;
        break;
      }
    }
  }

  return { size, modules };
};

// Returns { size, modules } where modules[row][col] is true for a dark square.
// The payload is the value itself (a card number), never a URL.
export const encodeQr = (value) => {
  let text = String(value ?? '').trim() || '0';
  let bytes = Array.from(new TextEncoder().encode(text));
  let version = pickVersion(bytes.length);

  const spec = VERSIONS[version];
  const maxBytes = Math.floor((spec.blocks * spec.data * 8 - 12) / 8);
  if (bytes.length > maxBytes) {
    // Far longer than any real card number — keep the code printable.
    text = new TextDecoder().decode(new Uint8Array(bytes.slice(0, maxBytes)));
    bytes = Array.from(new TextEncoder().encode(text));
    version = pickVersion(bytes.length);
  }

  const codewords = buildCodewords(text, version);

  let best = null;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = buildMatrix(version, codewords, mask);
    const score = penalty(candidate.modules);
    if (!best || score < best.score) best = { ...candidate, score };
  }

  return { version, size: best.size, modules: best.modules };
};