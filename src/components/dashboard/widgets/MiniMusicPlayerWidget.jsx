import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Music2, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { musicPlayer, formatTime } from '@/lib/musicPlayerStore';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { loadMusicAccessContext, buildPlaybackAccess, canPlayTrack } from '@/lib/musicPlayback';
import WidgetShell from './WidgetShell';

/**
 * Mini music player.
 *
 * Reads the app's existing shared player store and drives it — it never creates
 * an audio element of its own, and mounting, unmounting or rearranging it has
 * no effect on playback (the real <audio>/YouTube player lives in the Layout
 * player bar, which is why audio survives route changes).
 *
 * Availability is resolved with the same cached catalogs, unlock set (direct
 * song awards plus playlist-derived ones) and feature lock the Study Music page
 * uses, so a song is never offered here and refused there. A lookup that is
 * still running, or that failed, is reported as such — never as "unavailable".
 */
export default function MiniMusicPlayerWidget({ profile }) {
  const { track, isPlaying, currentTime, duration, status, error } = useMusicPlayer();
  const coverSrc = useSignedUrl(track?.coverImageUri);

  const [access, setAccess] = useState({ state: 'loading', value: null });

  const check = useCallback(() => {
    setAccess({ state: 'loading', value: null });
    loadMusicAccessContext()
      .then((context) => setAccess({ state: 'ready', value: buildPlaybackAccess(profile, context) }))
      .catch(() => setAccess({ state: 'failed', value: null }));
  }, [profile]);

  useEffect(() => { check(); }, [check]);

  if (!track) {
    return (
      <WidgetShell
        icon={Music2}
        title="Music"
        empty="No song selected"
        emptyHint="Pick a focus track to listen while you work."
        emptyAction={
          <Link to="/Music">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
              <Music2 className="w-4 h-4" aria-hidden="true" /> Choose music
            </span>
          </Link>
        }
      />
    );
  }

  const checking = access.state === 'loading';
  const checkFailed = access.state === 'failed';
  const playable = access.state === 'ready' ? canPlayTrack(track, profile, access.value) : false;
  const featureLocked = access.state === 'ready' && !!access.value?.featureLocked;

  const loadingAudio = status === 'loading' && isPlaying;
  const hasError = status === 'error' && !!error;
  const ended = status === 'ended';

  // A pause must always be possible; only starting something may be withheld.
  const canToggle = isPlaying || playable || hasError;

  const toggle = () => {
    if (hasError) { musicPlayer.resume(); return; } // same as Play: re-attempts the load
    if (!playable) return;
    if (isPlaying) musicPlayer.pause();
    else musicPlayer.resume();
  };

  const pct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const subtitle = track.description?.trim()
    ? track.description.trim()
    : track.sourceType === 'youtube'
      ? 'YouTube track'
      : 'Focus track';

  return (
    <WidgetShell
      icon={Music2}
      title="Now Playing"
      action={
        <Link
          to="/Music"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          Open Music <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </Link>
      }
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
          {coverSrc ? (
            <img src={coverSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <Music2 className="w-6 h-6 text-white" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{track.title}</p>
          <p className="text-xs text-slate-500 truncate">{loadingAudio ? 'Starting…' : subtitle}</p>
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={!canToggle}
          aria-label={hasError ? 'Try again' : isPlaying ? 'Pause' : 'Play'}
          title={hasError ? 'Try again' : isPlaying ? 'Pause' : 'Play'}
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingAudio ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : isPlaying && !hasError ? (
            <Pause className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-white/40 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>{ended ? 'Finished · play again' : formatTime(duration)}</span>
        </div>
      </div>

      {hasError ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{error.message}</span>
          <button
            type="button"
            onClick={() => musicPlayer.resume()}
            className="font-semibold underline shrink-0"
          >
            Try again
          </button>
        </p>
      ) : checking ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
          Checking this song…
        </p>
      ) : checkFailed ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">Couldn't check whether this song is still playable.</span>
          <button type="button" onClick={check} className="font-semibold underline shrink-0">
            Check again
          </button>
        </p>
      ) : !playable ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          {featureLocked
            ? 'Study Music is locked for your account right now.'
            : 'This song is no longer available for your account. Choose another track.'}
        </p>
      ) : null}
    </WidgetShell>
  );
}