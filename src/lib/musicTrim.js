// Song trim settings, shared by the track editor and both players.
//
// Two ideas:
//   • startAtSeconds — playback begins here, everything before it is skipped.
//   • skipSegments   — parts inside the song that playback jumps over.
// Both are plain seconds; the editor accepts "1:23" or "83".

export function parseTimeInput(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const parts = raw.split(':');
  if (parts.length > 2) return null;
  const nums = parts.map((p) => Number(p.trim()));
  if (nums.some((n) => !isFinite(n) || n < 0)) return null;
  const seconds = nums.reduce((total, n) => total * 60 + n, 0);
  return Math.round(seconds * 10) / 10;
}

export function formatClock(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function getSkipSegments(track) {
  const list = Array.isArray(track?.skipSegments) ? track.skipSegments : [];
  return list
    .map((seg) => ({ start: Number(seg?.start), end: Number(seg?.end) }))
    .filter((seg) => isFinite(seg.start) && isFinite(seg.end) && seg.start >= 0 && seg.end > seg.start)
    .sort((a, b) => a.start - b.start);
}

// Where playback should land if `time` falls inside a skipped part, else null.
export function skipTargetFor(track, time) {
  if (!isFinite(time)) return null;
  const segments = getSkipSegments(track);
  let cursor = time;
  let target = null;
  for (const seg of segments) {
    if (cursor >= seg.start - 0.15 && cursor < seg.end - 0.25) {
      cursor = seg.end;
      target = seg.end;
    }
  }
  return target;
}

// The nearest second a student is allowed to hear. A position inside a skipped
// part jumps to the end of that part, and a position before the song's start
// jumps to the start — so a cut can never be reached by seeking either.
export function clampToPlayable(track, time) {
  if (!isFinite(time)) return 0;
  const start = getPlaybackStart(track);
  let at = time < start ? start : time;
  for (let i = 0; i < 20; i += 1) {
    const target = skipTargetFor(track, at);
    if (target === null) break;
    at = target;
  }
  return at;
}

// The real first second of the song: the chosen start, moved past any part
// that start would have landed inside.
export function getPlaybackStart(track) {
  const start = Number(track?.startAtSeconds);
  let at = isFinite(start) && start > 0 ? start : 0;
  for (const seg of getSkipSegments(track)) {
    if (at >= seg.start - 0.15 && at < seg.end) at = seg.end;
  }
  return at;
}