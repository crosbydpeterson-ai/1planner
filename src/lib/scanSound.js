// Card chimes. Built-in sounds are synthesised in the browser, so there are no
// audio files to download. Browsers only allow audio after a tap, so the audio
// context is warmed up when a screen that scans or reads cards opens.
// An uploaded sound (a public file URL stored on the card) plays instead.
let ctx = null;
let currentAudio = null;

const ensure = () => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

export function primeScanAudio() {
  try {
    ensure();
  } catch {
    // no audio available
  }
}

// One note: a short tone that fades in and out so nothing clicks.
const note = (c, { freq, at = 0, dur = 0.18, type = 'sine', gain = 0.2, to }) => {
  const start = c.currentTime + at;
  const osc = c.createOscillator();
  const vol = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
  vol.gain.setValueAtTime(0.0001, start);
  vol.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.02, dur / 3));
  vol.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(vol).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
};

const run = (c, notes) => notes.forEach((n) => note(c, n));

const SUCCESS = {
  chime: (c) => run(c, [
    { freq: 1320, dur: 0.24, gain: 0.2 },
    { freq: 1760, at: 0.09, dur: 0.24, gain: 0.2 },
  ]),
  sparkle: (c) => run(c, [1568, 2093, 2637, 3136].map((f, i) =>
    ({ freq: f, at: i * 0.055, dur: 0.16, type: 'triangle', gain: 0.15 }))),
  coin: (c) => run(c, [
    { freq: 988, dur: 0.09, type: 'square', gain: 0.11 },
    { freq: 1319, at: 0.08, dur: 0.3, type: 'square', gain: 0.24 },
  ]),
  powerup: (c) => run(c, [523, 659, 784, 1046].map((f, i) =>
    ({ freq: f, at: i * 0.06, dur: 0.14, type: 'triangle', gain: 0.17 }))),
  zen: (c) => run(c, [
    { freq: 528, dur: 0.9, gain: 0.17 },
    { freq: 792, at: 0.01, dur: 0.8, gain: 0.06 },
  ]),
  arcade: (c) => run(c, [523, 659, 784, 1046, 1319].map((f, i) =>
    ({ freq: f, at: i * 0.045, dur: 0.1, type: 'square', gain: 0.12 }))),
  fanfare: (c) => run(c, [
    { freq: 523, dur: 0.12, type: 'triangle', gain: 0.16 },
    { freq: 659, at: 0.1, dur: 0.12, type: 'triangle', gain: 0.16 },
    { freq: 784, at: 0.2, dur: 0.14, type: 'triangle', gain: 0.18 },
    { freq: 1046, at: 0.32, dur: 0.34, type: 'triangle', gain: 0.2 },
    { freq: 1568, at: 0.34, dur: 0.3, type: 'sine', gain: 0.09 },
  ]),
  laser: (c) => run(c, [
    { freq: 1800, to: 420, dur: 0.26, type: 'sawtooth', gain: 0.11 },
    { freq: 2400, to: 700, at: 0.12, dur: 0.2, type: 'sine', gain: 0.07 },
  ]),
  twinkle: (c) => run(c, [2093, 2637, 3136, 2637, 3520].map((f, i) =>
    ({ freq: f, at: i * 0.07, dur: 0.12, gain: 0.13 }))),
  victory: (c) => run(c, [523, 659, 784, 1046, 1319, 1568].map((f, i) =>
    ({ freq: f, at: i * 0.08, dur: 0.22, type: 'triangle', gain: 0.16 }))),
  bubble: (c) => run(c, [
    { freq: 300, to: 900, dur: 0.16, gain: 0.16 },
    { freq: 420, to: 1250, at: 0.11, dur: 0.16, gain: 0.12 },
  ]),
  drumroll: (c) => run(c, [
    { freq: 210, to: 130, dur: 0.13, type: 'triangle', gain: 0.22 },
    { freq: 220, to: 140, at: 0.14, dur: 0.12, type: 'triangle', gain: 0.2 },
    { freq: 900, at: 0.3, dur: 0.3, type: 'triangle', gain: 0.18 },
    { freq: 1350, at: 0.32, dur: 0.26, gain: 0.08 },
  ]),
};

const REJECT = {
  buzz: (c) => note(c, { freq: 150, to: 110, dur: 0.3, type: 'sawtooth', gain: 0.13 }),
  thud: (c) => run(c, [
    { freq: 120, dur: 0.12, gain: 0.26 },
    { freq: 90, at: 0.14, dur: 0.18, gain: 0.2 },
  ]),
  deny: (c) => run(c, [
    { freq: 392, dur: 0.12, type: 'square', gain: 0.13 },
    { freq: 330, at: 0.16, dur: 0.18, type: 'square', gain: 0.11 },
  ]),
  clang: (c) => run(c, [
    { freq: 740, to: 520, dur: 0.35, type: 'square', gain: 0.12 },
    { freq: 1108, dur: 0.3, gain: 0.07 },
  ]),
  wobble: (c) => run(c, [
    { freq: 300, to: 180, dur: 0.4, gain: 0.18 },
    { freq: 250, to: 150, at: 0.2, dur: 0.4, gain: 0.14 },
  ]),
  glitch: (c) => run(c, [880, 220, 660, 180].map((f, i) =>
    ({ freq: f, at: i * 0.05, dur: 0.06, type: 'sawtooth', gain: 0.12 }))),
  error: (c) => run(c, [
    { freq: 520, dur: 0.1, type: 'square', gain: 0.14 },
    { freq: 380, at: 0.13, dur: 0.1, type: 'square', gain: 0.14 },
    { freq: 260, at: 0.26, dur: 0.22, type: 'square', gain: 0.14 },
  ]),
  trombone: (c) => run(c, [
    { freq: 392, dur: 0.2, type: 'sawtooth', gain: 0.12 },
    { freq: 370, at: 0.16, dur: 0.2, type: 'sawtooth', gain: 0.12 },
    { freq: 349, at: 0.32, dur: 0.2, type: 'sawtooth', gain: 0.12 },
    { freq: 330, at: 0.48, dur: 0.2, type: 'sawtooth', gain: 0.12 },
    { freq: 294, to: 262, at: 0.64, dur: 0.5, type: 'sawtooth', gain: 0.14 },
  ]),
};

export const SCAN_SOUNDS = [
  { id: 'chime', label: 'Chime' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'coin', label: 'Coin' },
  { id: 'powerup', label: 'Power-up' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'fanfare', label: 'Fanfare' },
  { id: 'victory', label: 'Victory' },
  { id: 'laser', label: 'Laser' },
  { id: 'twinkle', label: 'Twinkle' },
  { id: 'bubble', label: 'Bubble' },
  { id: 'drumroll', label: 'Drumroll' },
  { id: 'zen', label: 'Zen bell' },
];

export const REJECT_SOUNDS = [
  { id: 'buzz', label: 'Buzz' },
  { id: 'thud', label: 'Thud' },
  { id: 'deny', label: 'Deny' },
  { id: 'clang', label: 'Clang' },
  { id: 'wobble', label: 'Wobble' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'error', label: 'Error' },
  { id: 'trombone', label: 'Sad trombone' },
];

export const DEFAULT_SCAN_SOUND = 'chime';
export const DEFAULT_REJECT_SOUND = 'buzz';
export const CUSTOM_SOUND = 'custom';

const play = (recipes, id) => {
  try {
    const c = ensure();
    if (!c) return;
    (recipes[id] || recipes[Object.keys(recipes)[0]])(c);
  } catch {
    // no audio available
  }
};

// Plays an uploaded sound file. One at a time, so a quick re-tap never overlaps.
export const playSoundFile = (url) => {
  if (!url || typeof window === 'undefined') return;
  try {
    if (currentAudio) currentAudio.pause();
    const audio = new Audio(url);
    currentAudio = audio;
    audio.play().catch(() => {});
  } catch {
    // not playable in this browser
  }
};

// An uploaded sound wins when the card has one; otherwise the built-in chime.
export const playScanSound = (id = DEFAULT_SCAN_SOUND, url = '') => {
  if (url) return playSoundFile(url);
  play(SUCCESS, id);
};

export const playRejectSound = (id = DEFAULT_REJECT_SOUND, url = '') => {
  if (url) return playSoundFile(url);
  play(REJECT, id);
};