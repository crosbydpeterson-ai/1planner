// Lightweight singleton store for the persistent music player.
// The player bar (rendered in Layout) subscribes to this and drives the
// actual <audio> / YouTube iframe; the Music page calls play() to start a track.
//
// The store deliberately keeps two ideas apart:
//   • isPlaying — the student's intent (what they asked for)
//   • status    — what the media element actually reports
// A Play click sets status 'loading', never 'playing'. Only a real playback
// event ('playing' from the audio element, PLAYING from the YouTube player)
// moves it to 'playing', so the controls can never claim sound is coming out
// when it isn't. Failures land in 'error' with a retryable message, and a
// resume() from that state asks the player to load the track again.

const idleState = () => ({
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  pendingSeek: null,
  // 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
  status: 'idle',
  // { kind: 'blocked' | 'request' | 'unavailable' | 'media', message } while status is 'error'
  error: null,
  // Bumped to ask the player to re-attempt the current track (e.g. after a
  // failed or expired signed URL). The player reloads for the new token.
  retryToken: 0,
});

let state = idleState();
const listeners = new Set();

function emit() {
  for (const l of listeners) l(state);
}

export const musicPlayer = {
  getState: () => state,

  play: (track) => {
    state = { ...idleState(), track, isPlaying: true, status: 'loading' };
    emit();
  },

  // What the media element really reports — keeps isPlaying honest.
  setStatus: (status, error = null) => {
    const next = { ...state, status, error: status === 'error' ? error : null };
    if (status === 'playing') next.isPlaying = true;
    if (status === 'paused' || status === 'ended' || status === 'error') next.isPlaying = false;
    if (status === 'ended' && state.duration > 0) next.currentTime = state.duration;
    if (
      next.status === state.status &&
      next.error === state.error &&
      next.isPlaying === state.isPlaying &&
      next.currentTime === state.currentTime
    ) {
      return;
    }
    state = next;
    emit();
  },

  setPlaying: (isPlaying) => {
    if (state.isPlaying === isPlaying) return;
    state = {
      ...state,
      isPlaying,
      status: isPlaying ? 'loading' : state.track ? 'paused' : 'idle',
    };
    emit();
  },

  pause: () => {
    if (!state.track) return;
    state = { ...state, isPlaying: false, status: 'paused', error: null };
    emit();
  },

  // Also the retry path: from an error this asks the player to load the track
  // again (new retryToken) instead of just flipping a flag.
  resume: () => {
    if (!state.track) return;
    const retrying = state.status === 'error';
    state = {
      ...state,
      isPlaying: true,
      status: 'loading',
      error: null,
      retryToken: retrying ? state.retryToken + 1 : state.retryToken,
    };
    emit();
  },

  stop: () => {
    state = idleState();
    emit();
  },

  setTime: (currentTime) => {
    state = { ...state, currentTime };
    emit();
  },

  setDuration: (duration) => {
    if (state.duration === duration) return;
    state = { ...state, duration };
    emit();
  },

  seek: (t) => {
    state = { ...state, pendingSeek: t, currentTime: t };
    emit();
  },

  clearPendingSeek: () => {
    if (state.pendingSeek === null) return;
    state = { ...state, pendingSeek: null };
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

export function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}