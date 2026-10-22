import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Music2, ExternalLink, AlertTriangle } from 'lucide-react';
import { musicPlayer, formatTime } from '@/lib/musicPlayerStore';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { getUnlockedTrackIds, isTrackVisibleForUser } from '@/lib/musicAccess';
import WidgetShell from './WidgetShell';

/**
 * Mini music player.
 *
 * Reads the app's existing shared player store and drives it — it never creates
 * an audio element of its own, and mounting, unmounting or rearranging it has
 * no effect on playback (the real <audio>/YouTube player lives in the Layout
 * player bar, which is why audio survives route changes).
 */
export default function MiniMusicPlayerWidget({ profile }) {
  const { track, isPlaying, currentTime, duration } = useMusicPlayer();
  const coverSrc = useSignedUrl(track?.coverImageUri);

  const unlockedTrackIds = useMemo(() => getUnlockedTrackIds(profile), [profile]);
  const stillAvailable = track ? isTrackVisibleForUser(track, profile, unlockedTrackIds) : false;

  const chooseMusicLink = (
    <Link
      to="/Music"
      className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
    >
      Choose music <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </Link>
  );

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
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => (isPlaying ? musicPlayer.pause() : musicPlayer.resume())}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md transition-colors"
        >
          {isPlaying ? (
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
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {!stillAvailable ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          This song is no longer available for your account. Choose another track.
        </p>
      ) : null}
    </WidgetShell>
  );
}