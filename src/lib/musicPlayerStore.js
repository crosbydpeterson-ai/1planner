// Lightweight singleton store for the persistent music player.
// The player bar (rendered in Layout) subscribes to this and drives the
// actual <audio> / YouTube iframe; the Music page calls play() to start a track.

let state = { track: null, isPlaying: false };
const listeners = new Set();

function emit() {
  for (const l of listeners) l(state);
}

export const musicPlayer = {
  getState: () => state,
  play: (track) => {
    state = { track, isPlaying: true };
    emit();
  },
  setPlaying: (isPlaying) => {
    if (state.isPlaying === isPlaying) return;
    state = { ...state, isPlaying };
    emit();
  },
  pause: () => musicPlayer.setPlaying(false),
  resume: () => musicPlayer.setPlaying(true),
  stop: () => {
    state = { track: null, isPlaying: false };
    emit();
  },
  subscribe: (l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

// Extract a YouTube video ID from a watch / embed / shorts URL.
export function parseYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}