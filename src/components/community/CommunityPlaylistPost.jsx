import React from 'react';
import { ListMusic, Lock, Pause, Play } from 'lucide-react';
import { getUnlockedTrackIds, isPlayableTrack } from '@/lib/musicAccess';
import { musicPlayer } from '@/lib/musicPlayerStore';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';

/**
 * A playlist a student shared to the community. Everyone sees the whole list,
 * but a viewer may only play the songs in their own collection — a song they have
 * not unlocked shows as locked, and Play all skips it.
 */
export default function CommunityPlaylistPost({ data, viewerProfile }) {
  const { track: current, isPlaying } = useMusicPlayer();
  const tracks = data?.tracks || [];
  const unlockedTrackIds = getUnlockedTrackIds(viewerProfile);
  const playable = tracks.filter((t) => isPlayableTrack(t, viewerProfile, unlockedTrackIds));
  const playingThisList = isPlaying && current && playable.some((t) => t.id === current.id);

  const playAll = () => {
    if (playable.length === 0) return;
    if (playingThisList) { musicPlayer.pause(); return; }
    musicPlayer.playQueue(playable, 0);
  };

  return (
    <div className="mt-2 rounded-2xl border border-indigo-100 bg-white/60 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white shrink-0">
          <ListMusic className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{data?.name}</p>
          <p className="text-[11px] text-slate-400 truncate">
            {data?.ownerUsername ? `${data.ownerUsername} • ` : ''}{playable.length} of {tracks.length} songs in your collection
          </p>
        </div>
        <button
          type="button"
          onClick={playAll}
          disabled={playable.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 shrink-0"
        >
          {playingThisList ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {playingThisList ? 'Pause' : 'Play all'}
        </button>
      </div>

      <div className="border-t border-indigo-50 divide-y divide-indigo-50 max-h-56 overflow-y-auto">
        {tracks.map((t, i) => {
          const owned = playable.some((p) => p.id === t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!owned}
              onClick={() => musicPlayer.playQueue(playable, playable.findIndex((p) => p.id === t.id))}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left ${owned ? 'hover:bg-indigo-50/60' : 'opacity-70'}`}
            >
              <span className="text-[11px] text-slate-400 w-4 tabular-nums">{i + 1}</span>
              <span className="text-sm text-slate-700 flex-1 truncate">{t.title}</span>
              {owned ? (
                <Play className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                  <Lock className="w-3 h-3" />Not in your collection
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}