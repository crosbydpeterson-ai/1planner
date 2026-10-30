import React from 'react';
import { Play, Pause, X, Volume2, VolumeX, Loader2, AlertCircle, Repeat } from 'lucide-react';
import { formatTime } from '@/lib/musicPlayerStore';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { useMusicPlaybackEngine } from '@/hooks/useMusicPlaybackEngine';

/**
 * The visible music bar.
 *
 * It renders controls and always mounts the two media elements the playback
 * engine drives (see useMusicPlaybackEngine) — mounting them regardless of the
 * bar's visibility is what lets the first play after a page load work and lets
 * playback continue on pages where the bar is hidden.
 */
export default function MusicPlayerBar({ profile, hideUI = false }) {
  const engine = useMusicPlaybackEngine(profile);
  const { track, isPlaying, currentTime, duration, isLoading, hasError, error, muted, repeat, seeking } = engine;
  const coverSrc = useSignedUrl(track?.coverImageUri);

  const dur = duration || 0;
  const cur = seeking !== null ? seeking : currentTime;
  const toggleLabel = hasError ? 'Try again' : isLoading ? 'Pause' : isPlaying ? 'Pause' : 'Play';
  const showBar = !!track && !hideUI;

  return (
    <>
      {showBar ? (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-1 safe-area-pb pointer-events-none">
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 pointer-events-auto touch-manipulation">
            <div className="flex items-center gap-3 p-2">
              {coverSrc ? (
                <img src={coverSrc} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-lg flex-shrink-0">🎵</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{track.title}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {track.sourceType === 'youtube' ? 'YouTube' : 'Uploaded'}
                  {isLoading ? ' · loading…' : ''}
                </p>
              </div>
              <button
                onClick={engine.toggle}
                type="button"
                className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 touch-manipulation flex-shrink-0"
                aria-label={toggleLabel}
                title={toggleLabel}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying && !hasError ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={engine.toggleRepeat}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${repeat ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-100'}`}
                aria-label={repeat ? 'Repeat on' : 'Repeat off'}
                title={repeat ? 'Repeat on — this song or playlist keeps playing' : 'Repeat off'}
              >
                <Repeat className="w-4 h-4" />
              </button>
              <button
                onClick={() => engine.setMuted(m => !m)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={engine.stopEverything}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress / seek bar */}
            <div className="px-3 pb-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{formatTime(cur)}</span>
                <input
                  type="range"
                  min={0}
                  max={dur || 0}
                  step={0.1}
                  value={cur}
                  onChange={(e) => engine.beginSeek(parseFloat(e.target.value))}
                  onMouseUp={(e) => engine.commitSeek(parseFloat(e.target.value))}
                  onTouchEnd={(e) => engine.commitSeek(parseFloat(e.target.value))}
                  onKeyUp={(e) => engine.commitSeek(parseFloat(e.target.value))}
                  className="flex-1 h-2.5 accent-indigo-600 cursor-pointer touch-manipulation"
                  aria-label="Seek"
                />
                <span className="text-[10px] text-slate-400 tabular-nums w-8">{formatTime(dur)}</span>
              </div>
              {hasError ? (
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-600">
                  <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" />
                  <span>{error.message}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Media elements stay mounted independently of the visible bar, and stay
          rendered rather than display:none — headset browsers refuse to start
          media that lives inside a hidden element. */}
      <audio {...engine.media.audioProps} className="sr-only" />
      <div
        {...engine.media.hostProps}
        className="fixed bottom-0 left-0 w-px h-px overflow-hidden opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}