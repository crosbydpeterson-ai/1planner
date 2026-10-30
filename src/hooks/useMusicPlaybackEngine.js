import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { musicPlayer, parseYouTubeId } from '@/lib/musicPlayerStore';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { getSignedUrl, invalidateSignedUrl } from '@/hooks/useSignedUrl';
import { loadYouTubeIframeApi } from '@/lib/youtubeIframe';

/**
 * The playback engine behind the persistent music bar.
 *
 * It owns the single <audio> element and the single YouTube player for the
 * whole app, drives them from the shared player store, and reports what really
 * happened back into that store. The bar it belongs to only renders controls.
 *
 * Two rules make the whole thing reliable:
 *   1. The media elements are always mounted. The caller attaches the returned
 *      refs unconditionally — even when the bar itself is hidden — so the
 *      YouTube player is never created before its container exists, and a first
 *      play after a page load works without re-selecting a song. API readiness
 *      simply re-runs the load once it flips.
 *   2. Every asynchronous step is generation-guarded. A slow signed-URL
 *      response, a late YouTube callback, a stale play() rejection or a stale
 *      timeout can only ever touch the track that is still selected.
 */
const YOUTUBE_START_TIMEOUT = 8000; // no PLAYING by then → tell the student
const UPLOAD_START_TIMEOUT = 12000;
const YOUTUBE_SETTLE_MS = 1200; // ignore the previous video's pause/ended
// A few silent samples. Playing this on the first real tap unlocks sound output
// for the page on headset and tablet browsers, which otherwise refuse a play()
// that happens after the signed-URL request instead of straight inside the tap.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=';
const YOUTUBE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };

export function useMusicPlaybackEngine(profile) {
  const state = useMusicPlayer();
  const { track, isPlaying, pendingSeek, status, error, retryToken } = state;

  const audioRef = useRef(null);
  const hostRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytPollRef = useRef(null);
  const watchdogRef = useRef(null);

  // Generation guard + "what is actually loaded" bookkeeping.
  const generationRef = useRef(0);
  const uploadRef = useRef({ trackId: null, uri: null, url: null });
  const loadedUriRef = useRef(null);
  const ytRef = useRef({ trackId: null, loadedAt: 0 });
  const mediaKindRef = useRef(null); // 'upload' | 'youtube' | null
  const refreshRef = useRef(0); // bounded signed-URL refreshes for this track
  const loggedRef = useRef(null); // track id already logged as a real play
  const trackIdRef = useRef(null);
  const lastRetryRef = useRef(retryToken);
  const profileIdRef = useRef(profile?.id);
  const mutedRef = useRef(false);
  const seekingRef = useRef(false);

  const [ytReady, setYtReady] = useState(false);
  const [ytFailed, setYtFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(null);

  // ── logging ───────────────────────────────────────────────
  // Only a real playback event logs a play, and only once per track until the
  // song ends — a click that fails, or a retry, never counts as a play.
  const writeLog = async (action, t = musicPlayer.getState().track) => {
    if (!profile?.id || !t) return;
    try {
      await base44.entities.MusicPlayLog.create({
        profileId: profile.id,
        username: profile.username,
        trackId: t.id,
        trackTitle: t.title,
        action,
        timestamp: new Date().toISOString(),
      });
    } catch (e) { /* logging is best-effort */ }
  };

  const logRealPlay = (t) => {
    if (!t || loggedRef.current === t.id) return;
    loggedRef.current = t.id;
    writeLog('play', t);
  };

  // ── timers ────────────────────────────────────────────────
  function clearPoll() {
    if (ytPollRef.current) { clearInterval(ytPollRef.current); ytPollRef.current = null; }
  }

  function clearWatchdog() {
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
  }

  function startYtPoll() {
    clearPoll();
    ytPollRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || !player.getCurrentTime || mediaKindRef.current !== 'youtube') return;
      try {
        musicPlayer.setTime(player.getCurrentTime() || 0);
        const d = player.getDuration ? player.getDuration() : 0;
        if (d) musicPlayer.setDuration(d);
      } catch (e) { /* player torn down mid-poll */ }
    }, 500);
  }

  // One bounded timer per attempt: if nothing is playing by the time it fires,
  // say so instead of spinning forever. Cleared on any real state change.
  function armWatchdog(gen, kind) {
    clearWatchdog();
    if (!musicPlayer.getState().isPlaying) return;
    watchdogRef.current = setTimeout(() => {
      watchdogRef.current = null;
      if (gen !== generationRef.current) return;
      const s = musicPlayer.getState();
      if (!s.isPlaying || s.status === 'playing' || s.status === 'error') return;
      musicPlayer.setStatus('error', kind === 'youtube'
        ? { kind: 'blocked', message: "Playback didn't start — your browser may have blocked it. Tap Play to try again." }
        : { kind: 'media', message: 'This song is taking too long to start. Tap Play to try again.' });
    }, kind === 'youtube' ? YOUTUBE_START_TIMEOUT : UPLOAD_START_TIMEOUT);
  }

  // ── media control ─────────────────────────────────────────
  function applyMute(player = ytPlayerRef.current) {
    const audio = audioRef.current;
    if (audio) audio.muted = mutedRef.current;
    try {
      if (!player || typeof player.mute !== 'function') return;
      if (mutedRef.current) player.mute();
      else if (typeof player.unMute === 'function') player.unMute();
    } catch (e) { /* player not ready */ }
  }

  function pauseAudio() {
    const audio = audioRef.current;
    if (audio) { try { audio.pause(); } catch (e) { /* ignore */ } }
  }

  function stopYouTube() {
    const player = ytPlayerRef.current;
    try { if (player && typeof player.stopVideo === 'function') player.stopVideo(); } catch (e) { /* ignore */ }
    clearPoll();
    clearWatchdog();
  }

  // True only while the audio element holds the file of the track that is
  // selected right now — so a still-loaded previous song can never report its
  // position, pause or error into the new selection.
  const uploadIsCurrent = () => {
    const s = musicPlayer.getState();
    const t = s.track;
    if (mediaKindRef.current !== 'upload' || !t || t.sourceType !== 'upload') return false;
    if (t.id !== uploadRef.current.trackId) return false;
    return !t.audioFileUri || loadedUriRef.current === t.audioFileUri;
  };

  const youTubeIsCurrent = () => {
    const s = musicPlayer.getState();
    return mediaKindRef.current === 'youtube' && !!s.track && s.track.id === ytRef.current.trackId;
  };

  // Start (or stop) the audio element according to the *latest* intent, read
  // from the store — never from a possibly stale render closure.
  function applyUploadIntent(audio) {
    const s = musicPlayer.getState();
    if (!s.track || s.track.sourceType !== 'upload') return;
    const forTrackId = s.track.id;
    // Replay after a finished song starts from the top.
    if ((s.status === 'ended' || audio.ended) && audio.currentTime > 0) {
      try { audio.currentTime = 0; } catch (e) { /* ignore */ }
    }
    if (!s.isPlaying) {
      try { audio.pause(); } catch (e) { /* ignore */ }
      return;
    }
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch((err) => {
        const name = (err && err.name) || '';
        if (name === 'AbortError') return; // superseded by a newer load — stale
        // A failure that lands after the student moved on belongs to the old track.
        const current = musicPlayer.getState().track;
        if (!current || current.id !== forTrackId) return;
        if (name === 'NotAllowedError') {
          musicPlayer.setStatus('error', { kind: 'blocked', message: 'Your browser blocked playback. Tap Play to start.' });
          return;
        }
        musicPlayer.setStatus('error', { kind: 'media', message: "This song couldn't start. Tap Play to try again." });
      });
    }
    // play() on an element that is already running resolves without firing a
    // new 'playing' event, so confirm the honest state here.
    if (!audio.paused && musicPlayer.getState().status === 'loading') musicPlayer.setStatus('playing');
  }

  function applyYouTubeIntent(player) {
    if (!player) return;
    const s = musicPlayer.getState();
    if (!s.track || s.track.sourceType !== 'youtube') return;
    try {
      const playerState = typeof player.getPlayerState === 'function' ? player.getPlayerState() : null;
      // Replay after a finished video starts from the top.
      if ((s.status === 'ended' || playerState === YOUTUBE.ENDED) && typeof player.seekTo === 'function') {
        player.seekTo(0, true);
      }
      if (s.isPlaying) {
        player.playVideo();
        if (typeof player.getPlayerState === 'function' && player.getPlayerState() === YOUTUBE.PLAYING) {
          musicPlayer.setStatus('playing');
          startYtPoll();
        } else {
          armWatchdog(generationRef.current, 'youtube');
        }
      } else {
        player.pauseVideo();
        clearWatchdog();
      }
    } catch (e) { /* player not ready yet */ }
  }

  function applyPendingSeek() {
    const s = musicPlayer.getState();
    if (s.pendingSeek === null || !s.track) {
      if (s.pendingSeek !== null) musicPlayer.clearPendingSeek();
      return;
    }
    if (s.track.sourceType === 'upload') {
      const audio = audioRef.current;
      if (!audio || loadedUriRef.current !== s.track.audioFileUri) return; // applied once loaded
      try { audio.currentTime = s.pendingSeek; } catch (e) { return; }
    } else {
      const player = ytPlayerRef.current;
      if (!player || typeof player.seekTo !== 'function' || !youTubeIsCurrent()) return;
      try { player.seekTo(s.pendingSeek, true); } catch (e) { return; }
    }
    musicPlayer.clearPendingSeek();
  }

  // ── loading ───────────────────────────────────────────────
  // A cached signed URL is reused, so reopening the same song costs no request
  // and does not reload the media element — it just starts it again.
  async function loadUploadSource(t, gen, { forceFresh = false } = {}) {
    const audio = audioRef.current;
    if (!audio) return;

    const cached = uploadRef.current;
    let url = !forceFresh && cached.uri === t.audioFileUri ? cached.url : null;

    if (url && loadedUriRef.current === t.audioFileUri) {
      audio.muted = mutedRef.current;
      const s0 = musicPlayer.getState();
      // A fresh selection starts from the top; a resume keeps its position.
      if (s0.currentTime === 0 && audio.currentTime > 0.25) {
        try { audio.currentTime = 0; } catch (e) { /* ignore */ }
      }
      applyUploadIntent(audio);
      armWatchdog(gen, 'upload');
      return;
    }

    if (!url) {
      musicPlayer.setStatus('loading');
      try {
        if (forceFresh) invalidateSignedUrl(t.audioFileUri);
        url = await getSignedUrl(t.audioFileUri);
      } catch (e) {
        if (gen !== generationRef.current) return; // a newer track is loading
        musicPlayer.setStatus('error', { kind: 'request', message: "Couldn't load this song — the server didn't answer. Tap Play to try again." });
        return;
      }
      if (gen !== generationRef.current) return; // a newer track won the race
      const current = musicPlayer.getState().track;
      if (!current || current.id !== t.id) return; // the student moved on
      uploadRef.current = { trackId: t.id, uri: t.audioFileUri, url };
    }

    audio.src = url;
    loadedUriRef.current = t.audioFileUri;
    audio.muted = mutedRef.current;
    applyUploadIntent(audio);
    applyPendingSeek();
    armWatchdog(gen, 'upload');
  }

  function loadYouTube(t, ytId, gen) {
    if (!ytReady || !hostRef.current) return; // the effect re-runs when readiness flips
    musicPlayer.setStatus('loading');
    mediaKindRef.current = 'youtube';
    ytRef.current = { trackId: t.id, loadedAt: Date.now() };

    let player = ytPlayerRef.current;
    if (player && typeof player.loadVideoById === 'function') {
      try {
        player.loadVideoById(ytId);
      } catch (e) {
        player = null;
      }
    }
    if (!player) {
      try {
        player = new window.YT.Player(hostRef.current, {
          videoId: ytId,
          playerVars: { autoplay: 0, controls: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: (e) => {
              if (!youTubeIsCurrent()) return;
              applyMute(e.target);
              applyYouTubeIntent(e.target);
              applyPendingSeek();
            },
            onStateChange: (e) => handleYouTubeState(e.data),
            onError: (e) => handleYouTubeError(e.data),
          },
        });
        ytPlayerRef.current = player;
      } catch (e) {
        ytPlayerRef.current = null;
        musicPlayer.setStatus('error', { kind: 'unavailable', message: "Couldn't start the video player. Reload the page and try again." });
        return;
      }
    }
    applyMute();
    applyYouTubeIntent(ytPlayerRef.current);
    applyPendingSeek();
    armWatchdog(gen, 'youtube');
  }

  // ── media events ──────────────────────────────────────────
  function handleYouTubeState(ytState) {
    if (!youTubeIsCurrent()) return; // an event from a video we no longer show
    const settling = Date.now() - ytRef.current.loadedAt < YOUTUBE_SETTLE_MS;
    if (settling && (ytState === YOUTUBE.ENDED || ytState === YOUTUBE.PAUSED)) return;

    const t = musicPlayer.getState().track;
    switch (ytState) {
      case YOUTUBE.PLAYING:
        // Never overrule a pause the student asked for.
        if (!musicPlayer.getState().isPlaying) {
          try { ytPlayerRef.current?.pauseVideo?.(); } catch (e) { /* ignore */ }
          return;
        }
        clearWatchdog();
        musicPlayer.setStatus('playing');
        startYtPoll();
        logRealPlay(t);
        break;
      case YOUTUBE.PAUSED:
        if (musicPlayer.getState().status === 'error') return;
        clearWatchdog();
        clearPoll();
        musicPlayer.setStatus('paused');
        break;
      case YOUTUBE.BUFFERING:
        if (musicPlayer.getState().status === 'error') return;
        musicPlayer.setStatus('loading');
        break;
      case YOUTUBE.CUED:
        musicPlayer.setStatus(musicPlayer.getState().isPlaying ? 'loading' : 'paused');
        break;
      case YOUTUBE.ENDED:
        clearWatchdog();
        clearPoll();
        loggedRef.current = null; // a replay counts as a new play
        musicPlayer.setStatus('ended');
        writeLog('complete', t);
        musicPlayer.advance(); // Repeat loops here; otherwise the next song starts
        break;
      default:
        break;
    }
  }

  function handleYouTubeError(code) {
    if (!youTubeIsCurrent()) return;
    clearWatchdog();
    clearPoll();
    const message = code === 101 || code === 150
      ? "This video can't be embedded. Ask an admin to add it as an uploaded file."
      : "This video isn't available. Try another song.";
    musicPlayer.setStatus('error', { kind: 'unavailable', message });
  }

  function handleAudioError() {
    const audio = audioRef.current;
    const s = musicPlayer.getState();
    const t = s.track;
    if (!t || t.sourceType !== 'upload' || loadedUriRef.current !== t.audioFileUri) return;
    const code = audio?.error?.code;

    // A signed URL can expire while the bar stays open: refresh it once, then
    // retry. Bounded per track — never a retry loop.
    if (refreshRef.current < 1) {
      refreshRef.current += 1;
      clearWatchdog();
      const gen = ++generationRef.current;
      if (uploadRef.current.url) uploadRef.current = { ...uploadRef.current, url: null };
      loadUploadSource(t, gen, { forceFresh: true });
      return;
    }

    musicPlayer.setStatus('error', {
      kind: 'unavailable',
      message: code === 4
        ? "This audio file isn't available anymore. Ask an admin to re-upload it."
        : "This song couldn't be played. Tap Play to try again.",
    });
  }

  function stopEverything() {
    generationRef.current += 1;
    clearWatchdog();
    clearPoll();
    pauseAudio();
    stopYouTube();
    mediaKindRef.current = null;
    refreshRef.current = 0;
    loggedRef.current = null;
    musicPlayer.stop();
  }

  // ── lifecycle ─────────────────────────────────────────────
  // Load the YouTube IFrame API once through the shared readiness helper.
  useEffect(() => {
    let alive = true;
    loadYouTubeIframeApi()
      .then(() => { if (alive) setYtReady(true); })
      .catch(() => { if (alive) setYtFailed(true); });
    return () => { alive = false; };
  }, []);

  // React to the selected track. Runs again when the API becomes ready, which
  // is how a first-ever YouTube play is retried instead of being lost.
  useEffect(() => {
    const t = track;
    const gen = ++generationRef.current;
    clearWatchdog();

    const changedTrack = trackIdRef.current !== t?.id;
    const retrying = !changedTrack && lastRetryRef.current !== retryToken;
    trackIdRef.current = t?.id ?? null;
    lastRetryRef.current = retryToken;

    if (!t) return;

    if (t.sourceType === 'upload') {
      mediaKindRef.current = 'upload';
      uploadRef.current = { ...uploadRef.current, trackId: t.id };
      refreshRef.current = 0;
      pauseAudio(); // the previously loaded song stops immediately, not after the fetch
      stopYouTube(); // only one source may ever be playing
      loadUploadSource(t, gen, { forceFresh: retrying });
      return;
    }

    const ytId = parseYouTubeId(t.youtubeUrl);
    mediaKindRef.current = 'youtube';
    pauseAudio(); // never let uploaded audio and YouTube play together
    if (!ytId) {
      mediaKindRef.current = null;
      musicPlayer.setStatus('error', { kind: 'unavailable', message: "This track's video link can't be played. Try another song." });
      return;
    }
    if (!ytReady) {
      // The API can also land after the first check (or after a slow load).
      if (window.YT && window.YT.Player) {
        setYtReady(true);
        return;
      }
      if (ytFailed) {
        musicPlayer.setStatus('error', { kind: 'unavailable', message: "Couldn't start the video player. Reload the page and try again." });
      }
      return; // readiness flips → this effect runs again
    }
    loadYouTube(t, ytId, gen);
  }, [track?.id, track?.sourceType, track?.audioFileUri, track?.youtubeUrl, ytReady, ytFailed, retryToken]);

  // React to play / pause intent.
  useEffect(() => {
    if (!track) return;
    if (track.sourceType === 'upload') {
      const audio = audioRef.current;
      if (!audio || loadedUriRef.current !== track.audioFileUri) return; // the load owns starting it
      if (!isPlaying) clearWatchdog();
      applyUploadIntent(audio);
      return;
    }
    if (!youTubeIsCurrent()) return;
    if (!isPlaying) clearWatchdog();
    applyYouTubeIntent(ytPlayerRef.current);
  }, [isPlaying, status, track?.id, retryToken]);

  // Apply a pending seek.
  useEffect(() => {
    applyPendingSeek();
  }, [pendingSeek, track?.id, status]);

  // Apply mute with each player's own API.
  useEffect(() => {
    mutedRef.current = muted;
    applyMute();
  }, [muted, ytReady, track?.id]);

  // Unlock sound on the first tap anywhere in the app. Headset and tablet
  // browsers only allow audio that begins inside a gesture; the player instead
  // starts it after the signed-URL request, so without this the Play button can
  // look like it does nothing. Harmless once a real source has been loaded.
  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio || audio.src) return;
      try {
        audio.src = SILENT_WAV;
        const attempt = audio.play();
        if (attempt && typeof attempt.then === 'function') {
          attempt.then(() => audio.pause()).catch(() => {});
        }
      } catch (e) { /* nothing to unlock */ }
    };
    const events = ['pointerdown', 'touchstart', 'click'];
    events.forEach((ev) => document.addEventListener(ev, unlock, { capture: true, once: true }));
    return () => events.forEach((ev) => document.removeEventListener(ev, unlock, true));
  }, []);

  // A different student on the same device must never inherit playback.
  useEffect(() => {
    if (profileIdRef.current === profile?.id) return;
    profileIdRef.current = profile?.id;
    stopEverything();
  }, [profile?.id]);

  // Tear the player down with the app: timers, player and pending work.
  useEffect(() => () => {
    generationRef.current += 1;
    clearWatchdog();
    clearPoll();
    pauseAudio();
    try { ytPlayerRef.current?.destroy?.(); } catch (e) { /* already gone */ }
    ytPlayerRef.current = null;
    musicPlayer.stop();
  }, []);

  // ── controls ──────────────────────────────────────────────
  const toggle = () => {
    // From an error or a finished song, Play is the retry / replay affordance.
    if (status === 'error' || status === 'ended') { musicPlayer.resume(); return; }
    if (isPlaying) musicPlayer.pause();
    else musicPlayer.resume();
  };

  const beginSeek = (value) => {
    seekingRef.current = true;
    setSeeking(value);
  };

  const commitSeek = (value) => {
    seekingRef.current = false;
    setSeeking(null);
    musicPlayer.seek(value);
  };

  const isLoading = status === 'loading';
  const hasError = status === 'error' && !!error;

  // Everything the two media elements need, so the bar only has to place them.
  const audioProps = {
    ref: audioRef,
    onPlaying: () => { if (uploadIsCurrent()) { clearWatchdog(); musicPlayer.setStatus('playing'); } },
    onWaiting: () => {
      if (uploadIsCurrent() && musicPlayer.getState().status !== 'error') musicPlayer.setStatus('loading');
    },
    onPause: () => {
      if (uploadIsCurrent() && musicPlayer.getState().status !== 'error') musicPlayer.setStatus('paused');
    },
    onEnded: () => {
      if (!uploadIsCurrent()) return;
      clearWatchdog();
      loggedRef.current = null; // a replay counts as a new play
      musicPlayer.setStatus('ended');
      writeLog('complete');
      musicPlayer.advance(); // Repeat loops here; otherwise the next song starts
    },
    onTimeUpdate: (e) => {
      if (!uploadIsCurrent() || seekingRef.current) return;
      musicPlayer.setTime(e.target.currentTime);
    },
    onLoadedMetadata: (e) => {
      if (!uploadIsCurrent()) return;
      if (isFinite(e.target.duration)) musicPlayer.setDuration(e.target.duration);
      applyPendingSeek();
    },
    onError: () => { if (uploadIsCurrent()) handleAudioError(); },
  };

  return {
    track,
    isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    status,
    error,
    isLoading,
    hasError,
    muted,
    setMuted,
    repeat: state.repeat,
    toggleRepeat: () => musicPlayer.setRepeat(!musicPlayer.getState().repeat),
    seeking,
    beginSeek,
    commitSeek,
    toggle,
    stopEverything,
    media: { audioProps, hostProps: { ref: hostRef } },
  };
}