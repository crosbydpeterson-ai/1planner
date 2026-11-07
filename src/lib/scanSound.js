// Card chimes. Every sound is synthesised in the browser, so there are no audio
// files to download. Browsers only allow audio after a tap, so the audio context
// is warmed up when a screen that scans or reads cards opens.
let ctx = null;

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

const SUCCESS = {
  chime: (c) => {
    [1320, 1760].forEach((f, i) => note(c, { freq: f, at: i * 0.09, dur: 0.24, gain: 0.2 }));
  },
  sparkle: (c) => {
    [1568, 2093, 2637, 3136].forEach((f, i) =>
      note(c, { freq: f, at: i * 0.055, dur: 0.16, type: 'triangle', gain: 0.15 })
    );
  },
  coin: (c) => {
    note(c, { freq: 988, dur: 0.09, type: 'square', gain: 0.11 });
    note(c, { freq: 1319, at: 0.08, dur: 0.3, type: 'square', gain: 0.24 });
  },
  powerup: (c) => {
    [523, 659, 784, 1046].forEach((f, i) =>
      note(c, { freq: f, at: i * 0.06, dur: 0.14, type: 'triangle', gain: 0.17 })
    );
  },
  zen: (c) => {
    note(c, { freq: 528, dur: 0.9, gain: 0.17 });
    note(c, { freq: 792, at: 0.01, dur: 0.8, gain: 0.06 });
  },
};

const REJECT = {
  buzz: (c) => {
    note(c, { freq: 150, to: 110, dur: 0.3, type: 'sawtooth', gain: 0.13 });
  },
  thud: (c) => {
    note(c, { freq: 120, dur: 0.12, gain: 0.26 });
    note(c, { freq: 90, at: 0.14, dur: 0.18, gain: 0.2 });
  },
  deny: (c) => {
    note(c, { freq: 392, dur: 0.12, type: 'square', gain: 0.13 });
    note(c, { freq: 330, at: 0.16, dur: 0.18, type: 'square', gain: 0.11 });
  },
};

export const SCAN_SOUNDS = [
  { id: 'chime', label: 'Chime' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'coin', label: 'Coin' },
  { id: 'powerup', label: 'Power-up' },
  { id: 'zen', label: 'Zen bell' },
];

export const REJECT_SOUNDS = [
  { id: 'buzz', label: 'Buzz' },
  { id: 'thud', label: 'Thud' },
  { id: 'deny', label: 'Deny' },
];

export const DEFAULT_SCAN_SOUND = 'chime';
export const DEFAULT_REJECT_SOUND = 'buzz';

const play = (recipes, id) => {
  try {
    const c = ensure();
    if (!c) return;
    (recipes[id] || recipes[Object.keys(recipes)[0]])(c);
  } catch {
    // no audio available
  }
};

// Plays the card's own chime; an unset or unknown choice falls back to the first.
export const playScanSound = (id = DEFAULT_SCAN_SOUND) => play(SUCCESS, id);
export const playRejectSound = (id = DEFAULT_REJECT_SOUND) => play(REJECT, id);