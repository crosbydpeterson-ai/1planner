// Short chime played the moment a card is read. It is generated in the browser,
// so there is no audio file to download. Browsers only allow audio after a tap,
// so the audio context is warmed up when the scan screen opens.
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

export function playScanSound() {
  try {
    const c = ensure();
    if (!c) return;
    const now = c.currentTime;
    [1320, 1760].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const start = now + i * 0.09;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
      osc.connect(gain).connect(c.destination);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  } catch {
    // no audio available
  }
}